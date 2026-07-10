"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { Logo } from "@/components/brand";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  createSubscriptionCheckout,
  createSubscriptionPaymentIntent,
  getPaymentIntentStatus,
} from "@/lib/api/client";
import { hasActiveSubscription } from "@/lib/auth/subscription";
import { ApiError } from "@/lib/api/request";
import { cn } from "@/lib/utils";

import {
  CardBrandMarks,
  CheckoutField,
  CheckoutInput,
  CheckoutSelect,
  CvcIcon,
  PaymentInputShell,
  SecureShieldIcon,
} from "./checkout-form-controls";
import styles from "./subscribe-page.styles";

const PAYMENT_INTENT_SESSION_KEY = "flowci_paymongo_payment_intent_id";
function getPayMongoPublicKey() {
  return process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? "";
}

type SignedOutSessionRecheck = "idle" | "checking" | "checked";

const PAYMENT_PROVIDER_OBJECT_ID_PATTERN = /\b(?:pi|pm|cus|sub)_[A-Za-z0-9]+\b/g;
const PAYMONGO_DOCUMENTED_TEST_CARD_NUMBERS = new Set(["5123000000000002"]);
const CARD_NUMBER_LENGTH_FOR_INLINE_VALIDATION = 16;

const paymentMethods: Array<{ id: PaymentMethodId; label: string; description: string }> = [
  { id: "card", label: "Card", description: "Visa or Mastercard." },
  { id: "gcash", label: "GCash", description: "Pay with your GCash wallet." },
  { id: "maya", label: "Maya", description: "Pay with Maya." },
];

type BillingFieldErrors = Partial<Record<
  | "billingName"
  | "billingEmail"
  | "addressLine1"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "cardNumber"
  | "expiration"
  | "securityCode",
  string
>>;

type SubscribePlanId = "starter" | "growth" | "business";
type HostedPaymentMethodId = "gcash" | "maya";
type PaymentMethodId = HostedPaymentMethodId | "card";
type CheckoutStep = "method" | "card";

interface PayMongoPaymentMethodResponse {
  data?: {
    id?: string;
  };
}

interface PayMongoErrorPayload {
  errors?: Array<{
    code?: string;
    detail?: string;
    sub_code?: string;
  }>;
}

interface PayMongoAttachResponse {
  data?: {
    attributes?: {
      status?: string;
      next_action?: {
        redirect?: {
          url?: string;
        };
        redirect_url?: string;
      };
      last_payment_error?: {
        code?: string;
        detail?: string;
        sub_code?: string;
      };
    };
  };
}

const planCopy: Record<
  SubscribePlanId,
  { label: string; price: string; dueToday: string; summary: string }
> = {
  starter: {
    label: "Starter",
    price: "\u20B1300.00",
    dueToday: "\u20B1300.00",
    summary: "\u20B1300 in monthly workspace credit included",
  },
  growth: {
    label: "Growth",
    price: "Custom",
    dueToday: "Pending sales review",
    summary: "Growth plan details are finalized before billing starts",
  },
  business: {
    label: "Business",
    price: "Contact sales",
    dueToday: "Pending sales review",
    summary: "Business plans use assisted billing and onboarding",
  },
};

function getPlan(raw: string | null): SubscribePlanId {
  return raw === "growth" || raw === "business" ? raw : "starter";
}

function onlyDigits(value: string, limit: number) {
  return value.replace(/\D/g, "").slice(0, limit);
}

function groupCardDigits(value: string) {
  return value.match(/.{1,4}/g)?.join(" ") ?? "";
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

function PaymentMethodLogo({ id }: { id: PaymentMethodId }) {
  if (id === "card") {
    return (
      <span className={styles.methodCardLogos} data-payment-method-logo="card" aria-label="Visa and Mastercard accepted">
        <img alt="Visa" src="/payment-logos/visa.svg" />
        <img alt="Mastercard" src="/payment-logos/mastercard.svg" />
      </span>
    );
  }

  if (id === "gcash") {
    return (
      <span className={styles.methodWalletLogo} data-payment-method-logo="gcash" aria-label="GCash">
        <img alt="GCash" src="/payment-logos/gcash.svg" />
      </span>
    );
  }

  return (
    <span className={styles.methodWalletLogo} data-payment-method-logo="maya" aria-label="Maya">
      <img alt="Maya" src="/payment-logos/maya.svg" />
    </span>
  );
}

function isSupportedCard(value: string) {
  return /^4\d{12}(\d{3})?$/.test(value) || /^5[1-5]\d{14}$/.test(value) || /^2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12}$/.test(value);
}

function passesLuhn(value: string) {
  let sum = 0;
  let shouldDouble = false;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return value.length > 0 && sum % 10 === 0;
}

function isDocumentedPayMongoTestCard(value: string) {
  return getPayMongoPublicKey().startsWith("pk_test_") && PAYMONGO_DOCUMENTED_TEST_CARD_NUMBERS.has(value);
}

function isValidCardNumber(value: string) {
  return (isSupportedCard(value) && passesLuhn(value)) || isDocumentedPayMongoTestCard(value);
}

function getPayMongoAuthorization() {
  return `Basic ${window.btoa(`${getPayMongoPublicKey()}:`)}`;
}

class PayMongoRequestError extends Error {
  constructor(
    readonly step: string,
    readonly status: number,
    readonly payload: PayMongoErrorPayload,
  ) {
    super(`${step} failed with status ${status}`);
    this.name = "PayMongoRequestError";
  }
}

async function readPayMongoResponse<T>(response: Response, step: string): Promise<T> {
  const payload = (await response.json()) as T;
  if (!response.ok) {
    throw new PayMongoRequestError(step, response.status, payload as PayMongoErrorPayload);
  }
  return payload;
}

function getPayMongoErrorDetail(error?: { code?: string; detail?: string; sub_code?: string }) {
  if (!error) return null;
  return error.detail ?? error.sub_code ?? error.code ?? null;
}

function getCustomerSafePaymentDetail(detail: string | null) {
  if (!detail) return null;

  if (detail.toLowerCase().includes("already succeeded")) {
    return "This payment was already completed. Please refresh the page.";
  }

  const sanitizedDetail = detail.replace(PAYMENT_PROVIDER_OBJECT_ID_PATTERN, "this payment");
  return sanitizedDetail.trim() || null;
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof PayMongoRequestError) {
    const firstError = error.payload.errors?.[0];
    const detail = getCustomerSafePaymentDetail(getPayMongoErrorDetail(firstError));
    return detail ?? "Payment failed. Please check the details and try again.";
  }

  if (error instanceof ApiError) {
    const details = error.details as { message?: string } | string | undefined;
    const detailMessage = typeof details === "string" ? details : details?.message;
    return detailMessage ? `Payment setup failed: ${detailMessage}` : `Payment setup failed with status ${error.status}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "We could not process this card. Please check the details and try again.";
}

function getRedirectUrl(payload: PayMongoAttachResponse) {
  const nextAction = payload.data?.attributes?.next_action;
  return nextAction?.redirect?.url ?? nextAction?.redirect_url ?? null;
}

function getExpiryParts(value: string) {
  const month = Number(value.slice(0, 2));
  const year = Number(`20${value.slice(2, 4)}`);
  return { month, year };
}

function getRequiredString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function validateBillingForm(formData: FormData, cardDigits: string, expirationDigits: string, securityCode: string, cardNumberError: string | null) {
  const errors: BillingFieldErrors = {};

  if (!getRequiredString(formData, "billingName")) errors.billingName = "Enter your billing name.";
  if (!getRequiredString(formData, "billingEmail")) errors.billingEmail = "Enter your billing email.";
  if (!getRequiredString(formData, "addressLine1")) errors.addressLine1 = "Enter your billing address.";
  if (!getRequiredString(formData, "city")) errors.city = "Enter your billing city.";
  if (!getRequiredString(formData, "state")) errors.state = "Enter your billing state or province.";
  if (!getRequiredString(formData, "zip")) errors.zip = "Enter your ZIP or postal code.";
  if (!getRequiredString(formData, "country")) errors.country = "Select your billing country.";
  if (cardNumberError || !isValidCardNumber(cardDigits)) errors.cardNumber = cardNumberError ?? "Enter a valid card number.";
  if (expirationDigits.length !== 4) errors.expiration = "Enter a valid expiration date.";
  if (securityCode.length < 3) errors.securityCode = "Enter a valid security code.";

  return errors;
}

function SubscribePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, session, error: sessionError, refresh } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BillingFieldErrors>({});
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("method");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [cardDigits, setCardDigits] = useState("");
  const [expirationDigits, setExpirationDigits] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [signedOutSessionRecheck, setSignedOutSessionRecheck] = useState<SignedOutSessionRecheck>("idle");
  const isMountedRef = useRef(true);

  const selectedPlan = useMemo(
    () => getPlan(searchParams.get("plan")),
    [searchParams],
  );
  const returningPaymentIntentId = searchParams.get("payment_intent");
  const plan = planCopy[selectedPlan];
  const isCustomPlan = selectedPlan !== "starter";
  const defaultEmail = session?.user.email ?? "";
  const hasSubscription = hasActiveSubscription(session);
  const cardNumber = groupCardDigits(cardDigits);
  const expirationDate = formatExpiry(expirationDigits);
  const cardNumberError = cardDigits.length >= CARD_NUMBER_LENGTH_FOR_INLINE_VALIDATION && !isValidCardNumber(cardDigits) ? "Your card number is invalid." : null;
  const cardNumberFieldError = cardNumberError ?? fieldErrors.cardNumber ?? null;

  useEffect(() => {
    if (!defaultEmail) return;
    setBillingEmail((current) => current || defaultEmail);
  }, [defaultEmail]);

  function clearFieldError(field: keyof BillingFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }


    if (status !== "signed-out") {
      if (signedOutSessionRecheck !== "idle") setSignedOutSessionRecheck("idle");
      return;
    }

    if (signedOutSessionRecheck === "idle") {
      setSignedOutSessionRecheck("checking");
      void refresh().finally(() => {
        if (isMountedRef.current) setSignedOutSessionRecheck("checked");
      });
      return;
    }

    if (signedOutSessionRecheck === "checked") {
      return;
    }
  }, [refresh, signedOutSessionRecheck, status]);

  useEffect(() => {
    if (status !== "signed-in" || !returningPaymentIntentId) return;

    let active = true;
    setIsSubmitting(true);
    setCheckoutMessage("Confirming payment...");

    void getPaymentIntentStatus(returningPaymentIntentId)
      .then(async (result) => {
        if (!active) return;
        if (result.subscription) {
          window.sessionStorage.removeItem(PAYMENT_INTENT_SESSION_KEY);
          await refresh();
          const successParams = new URLSearchParams({ plan: selectedPlan });
          router.replace(`/subscribe/success?${successParams.toString()}`);
          return;
        }
        setCheckoutMessage(
          result.status === "processing"
            ? "Your payment is still processing. Please refresh in a moment."
            : "We could not confirm this payment yet.",
        );
      })
      .catch(() => {
        if (active) setCheckoutMessage("We could not confirm this payment yet.");
      })
      .finally(() => {
        if (active) setIsSubmitting(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, returningPaymentIntentId, router, selectedPlan, status]);

  async function createPayMongoPaymentMethod(formData: FormData) {
    const { month, year } = getExpiryParts(expirationDigits);
    const response = await fetch("https://api.paymongo.com/v1/payment_methods", {
      method: "POST",
      headers: {
        Authorization: getPayMongoAuthorization(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: "card",
            details: {
              card_number: cardDigits,
              exp_month: month,
              exp_year: year,
              cvc: securityCode,
            },
            billing: {
              name: getRequiredString(formData, "billingName"),
              email: getRequiredString(formData, "billingEmail"),
              address: {
                line1: String(formData.get("addressLine1") ?? ""),
                line2: String(formData.get("addressLine2") ?? ""),
                city: String(formData.get("city") ?? ""),
                state: String(formData.get("state") ?? ""),
                postal_code: String(formData.get("zip") ?? ""),
                country: String(formData.get("country") || "PH"),
              },
            },
          },
        },
      }),
    });
    const payload = await readPayMongoResponse<PayMongoPaymentMethodResponse>(response, "Payment method failed");
    const paymentMethodId = payload.data?.id;
    if (!paymentMethodId) throw new Error("The payment processor did not return a payment method.");
    return paymentMethodId;
  }

  async function attachPayMongoPaymentMethod(
    paymentIntentId: string,
    clientKey: string,
    paymentMethodId: string,
  ) {
    const params = new URLSearchParams({
      plan: selectedPlan,
      payment_intent: paymentIntentId,
    });
    const returnUrl = `${window.location.origin}/subscribe/success?${params.toString()}`;
    const response = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/attach`,
      {
        method: "POST",
        headers: {
          Authorization: getPayMongoAuthorization(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
              return_url: returnUrl,
            },
          },
        }),
      },
    );
    return readPayMongoResponse<PayMongoAttachResponse>(response, "Payment confirmation failed");
  }

  function handleBackToPaymentMethods() {
    setCheckoutStep("method");
    setCheckoutMessage(null);
    setFieldErrors({});
  }

  async function startHostedCheckout(paymentMethod: HostedPaymentMethodId) {
    setIsSubmitting(true);
    try {
      const checkout = await createSubscriptionCheckout("pro", paymentMethod);
      if (checkout.redirectUrl) {
        window.location.assign(checkout.redirectUrl);
        return;
      }
      setCheckoutMessage("Payment checkout did not return a redirect URL.");
    } catch (error) {
      console.error("[subscribe] hosted checkout failed", error);
      setCheckoutMessage(getCheckoutErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutMessage(null);
    setFieldErrors({});

    if (isCustomPlan) return;

    if (hasSubscription) {
      router.push("/settings?billing=active");
      return;
    }

    if (checkoutStep === "method") {
      if (!selectedPaymentMethod) {
        setCheckoutMessage("Choose a payment method.");
        return;
      }

      if (selectedPaymentMethod === "card") {
        setCheckoutStep("card");
        return;
      }

      await startHostedCheckout(selectedPaymentMethod);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nextFieldErrors = validateBillingForm(formData, cardDigits, expirationDigits, securityCode, cardNumberError);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    if (!getPayMongoPublicKey()) {
      setCheckoutMessage("Payment checkout is not configured.");
      return;
    }


    setIsSubmitting(true);
    try {
      const intent = await createSubscriptionPaymentIntent("pro");
      window.sessionStorage.setItem(PAYMENT_INTENT_SESSION_KEY, intent.paymentIntentId);
      const paymentMethodId = await createPayMongoPaymentMethod(formData);
      const attached = await attachPayMongoPaymentMethod(
        intent.paymentIntentId,
        intent.clientKey,
        paymentMethodId,
      );
      const redirectUrl = getRedirectUrl(attached);
      const attributes = attached.data?.attributes;
      const nextStatus = attributes?.status;

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      if (nextStatus === "awaiting_payment_method") {
        const detail = getCustomerSafePaymentDetail(getPayMongoErrorDetail(attributes?.last_payment_error));
        setCheckoutMessage(detail ? `Payment failed: ${detail}` : "This payment method was rejected.");
        return;
      }

      if (nextStatus === "succeeded") {
        const result = await getPaymentIntentStatus(intent.paymentIntentId);
        if (result.subscription) {
          window.sessionStorage.removeItem(PAYMENT_INTENT_SESSION_KEY);
          await refresh();
          const successParams = new URLSearchParams({ plan: selectedPlan });
          router.push(`/subscribe/success?${successParams.toString()}`);
          return;
        }
      }

      setCheckoutMessage("Your payment is processing. Please wait a moment and refresh.");
    } catch (error) {
      console.error("[subscribe] PayMongo payment failed", error);
      setCheckoutMessage(getCheckoutErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "signed-out" && signedOutSessionRecheck === "checked") {
    return <PipelineLoader label="We could not confirm your sign-in. Please return to signup and try again." />;
  }

  if (status === "loading" || status === "signed-out") {
    return <PipelineLoader label="Preparing payment" />;
  }

  if (status === "error") {
    return <PipelineLoader label={sessionError ?? "Preparing payment"} />;
  }

  return (
    <main className={styles.shell}>
      <section className={styles.formPanel} aria-labelledby="subscribe-title">
        <div className={styles.inner}>
          <Link className={styles.logoLink} href="/" aria-label="AlphaCI home">
            <Logo size={34} priority />
            <span className={styles.brandWordmark}>
              <strong>Alpha</strong>
              <em>CI</em>
            </span>
          </Link>

          <nav className={styles.breadcrumb} aria-label="Checkout progress">
            <Link href="/signup?step=plan">Plans</Link>
            <span aria-hidden="true">&gt;</span>
            <strong>Payment</strong>
          </nav>

          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            {checkoutStep === "method" ? (
              <>
                <fieldset className={styles.methodFieldset}>
                  <legend>Choose payment method</legend>
                  <div className={styles.methodList}>
                    {paymentMethods.map((method) => {
                      const isSelected = selectedPaymentMethod === method.id;
                      return (
                        <label
                          className={cn(styles.methodOption, isSelected && styles.methodOptionSelected)}
                          data-payment-method-option={method.id}
                          key={method.id}
                        >
                          <input
                            aria-label={method.label}
                            checked={isSelected}
                            name="paymentMethod"
                            onChange={() => {
                              setSelectedPaymentMethod(method.id);
                              setCheckoutMessage(null);
                            }}
                            type="radio"
                            value={method.id}
                          />
                          <span className={styles.methodLogoSlot}>
                            <PaymentMethodLogo id={method.id} />
                          </span>
                          <span className={styles.methodOptionContent}>
                            <span className={styles.methodOptionTop}>
                              <strong>{method.label}</strong>
                              <span aria-hidden="true">{isSelected ? "Selected" : ""}</span>
                            </span>
                            <em>{method.description}</em>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {checkoutMessage ? (
                  <p className={styles.notice} role="status">
                    {checkoutMessage}
                  </p>
                ) : null}

                <Button className={styles.submitButton} disabled={isSubmitting} loading={isSubmitting} type="submit" variant="secondary">
                  {isSubmitting ? "Starting checkout..." : "Continue"}
                </Button>
              </>
            ) : (
              <>
                <button className={styles.backButton} data-testid="payment-method-back" onClick={handleBackToPaymentMethods} type="button">
                  Back to payment methods
                </button>
            <CheckoutField error={fieldErrors.billingName} htmlFor="billing-name" label="Billing name">
              <CheckoutInput
                autoComplete="name"
                id="billing-name"
                name="billingName"
                aria-describedby={fieldErrors.billingName ? "billing-name-error" : undefined}
                aria-invalid={Boolean(fieldErrors.billingName)}
                onChange={(event) => {
                  setBillingName(event.target.value);
                  clearFieldError("billingName");
                }}
                required
                value={billingName}
              />
            </CheckoutField>

            <CheckoutField
              error={fieldErrors.billingEmail}
              description="Where invoices get sent. This can be different from your account email address."
              htmlFor="billing-email"
              label="Billing email"
            >
              <CheckoutInput
                autoComplete="email"
                id="billing-email"
                name="billingEmail"
                aria-describedby={fieldErrors.billingEmail ? "billing-email-error" : undefined}
                aria-invalid={Boolean(fieldErrors.billingEmail)}
                onChange={(event) => {
                  setBillingEmail(event.target.value);
                  clearFieldError("billingEmail");
                }}
                required
                type="email"
                value={billingEmail}
              />
            </CheckoutField>

            <fieldset className={styles.addressGroup}>
              <legend>Billing address</legend>
              <CheckoutInput
                aria-describedby={fieldErrors.addressLine1 ? "address-line-1-error" : undefined}
                aria-invalid={Boolean(fieldErrors.addressLine1)}
                aria-label="Address line 1"
                className={cn(styles.addressFieldControl, styles.addressInputTop)}
                id="address-line-1"
                name="addressLine1"
                onChange={() => clearFieldError("addressLine1")}
                placeholder="Address line 1"
                required
              />
              {fieldErrors.addressLine1 ? <em className={styles.fieldError} id="address-line-1-error">{fieldErrors.addressLine1}</em> : null}
              <CheckoutInput className={cn(styles.addressFieldControl, styles.addressInputMiddle)} name="addressLine2" placeholder="Address line 2" />
              <CheckoutInput
                aria-describedby={fieldErrors.city ? "city-error" : undefined}
                aria-invalid={Boolean(fieldErrors.city)}
                aria-label="City"
                className={cn(styles.addressFieldControl, styles.addressInputMiddle)}
                id="city"
                name="city"
                onChange={() => clearFieldError("city")}
                placeholder="City"
                required
              />
              {fieldErrors.city ? <em className={styles.fieldError} id="city-error">{fieldErrors.city}</em> : null}
              <div className={styles.addressSplitRow}>
                <CheckoutInput
                  aria-describedby={fieldErrors.state ? "state-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.state)}
                  aria-label="State or province"
                  className={cn(styles.addressFieldControl, styles.addressInputLeft)}
                  id="state"
                  name="state"
                  onChange={() => clearFieldError("state")}
                  placeholder="State/province"
                  required
                />
                <CheckoutInput
                  aria-describedby={fieldErrors.zip ? "zip-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.zip)}
                  aria-label="ZIP or postal code"
                  className={cn(styles.addressFieldControl, styles.addressInputRight)}
                  id="zip"
                  name="zip"
                  onChange={() => clearFieldError("zip")}
                  placeholder="ZIP code"
                  required
                />
              </div>
              {fieldErrors.state ? <em className={styles.fieldError} id="state-error">{fieldErrors.state}</em> : null}
              {fieldErrors.zip ? <em className={styles.fieldError} id="zip-error">{fieldErrors.zip}</em> : null}
              <CheckoutSelect
                aria-describedby={fieldErrors.country ? "country-error" : undefined}
                aria-invalid={Boolean(fieldErrors.country)}
                aria-label="Billing country"
                className={cn(styles.addressFieldControl, styles.addressSelect)}
                id="country"
                name="country"
                defaultValue=""
                onChange={() => clearFieldError("country")}
                required
              >
                <option value="" disabled>Select billing country</option>
                <option value="PH">Philippines</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AF">Afghanistan</option>
                <option value="AL">Albania</option>
                <option value="DZ">Algeria</option>
                <option value="AS">American Samoa</option>
                <option value="SG">Singapore</option>
              </CheckoutSelect>
              {fieldErrors.country ? <em className={styles.fieldError} id="country-error">{fieldErrors.country}</em> : null}
            </fieldset>

            <CheckoutField error={cardNumberFieldError} htmlFor="card-number" label="Card number">
              <PaymentInputShell variant="card" suffix={<CardBrandMarks />}>
                <CheckoutInput
                  aria-describedby={cardNumberFieldError ? "card-number-error" : undefined}
                  aria-invalid={Boolean(cardNumberFieldError)}
                  autoComplete="cc-number"
                  id="card-number"
                  inputMode="numeric"
                  name="cardNumber"
                  onChange={(event) => {
                    setCardDigits(onlyDigits(event.target.value, 16));
                    clearFieldError("cardNumber");
                  }}
                  pattern="[0-9 ]*"
                  placeholder="1234 1234 1234 1234"
                  value={cardNumber}
                />
              </PaymentInputShell>
            </CheckoutField>

            <div className={styles.twoColumnFields}>
              <CheckoutField error={fieldErrors.expiration} htmlFor="expiration" label="Expiration date">
                <CheckoutInput
                  aria-describedby={fieldErrors.expiration ? "expiration-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.expiration)}
                  autoComplete="cc-exp"
                  id="expiration"
                  inputMode="numeric"
                  maxLength={7}
                  name="expiration"
                  onChange={(event) => {
                    setExpirationDigits(onlyDigits(event.target.value, 4));
                    clearFieldError("expiration");
                  }}
                  pattern="[0-9 /]*"
                  placeholder="MM / YY"
                  value={expirationDate}
                />
              </CheckoutField>
              <CheckoutField error={fieldErrors.securityCode} htmlFor="security-code" label="Security code">
                <PaymentInputShell variant="cvc" suffix={<CvcIcon />}>
                  <CheckoutInput
                    aria-describedby={fieldErrors.securityCode ? "security-code-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.securityCode)}
                    autoComplete="cc-csc"
                    id="security-code"
                    inputMode="numeric"
                    maxLength={3}
                    name="securityCode"
                    onChange={(event) => {
                      setSecurityCode(onlyDigits(event.target.value, 3));
                      clearFieldError("securityCode");
                    }}
                    pattern="[0-9]*"
                    placeholder="CVC"
                    value={securityCode}
                  />
                </PaymentInputShell>
              </CheckoutField>
            </div>

            {checkoutMessage ? (
              <p className={styles.notice} role="status">
                {checkoutMessage}
              </p>
            ) : null}

            <Button className={styles.submitButton} disabled={isSubmitting} loading={isSubmitting} type="submit" variant="secondary">
              {isSubmitting ? "Processing payment..." : hasSubscription ? "Manage billing" : "Save payment details"}
            </Button>
              </>
            )}
          </form>

          {checkoutStep === "card" ? (
            <p className={styles.secureCopy}>
              <SecureShieldIcon />
              Card details are encrypted and never stored by AlphaCI.
            </p>
          ) : null}
        </div>
      </section>

      <aside className={styles.summaryPanel} aria-label="Billing summary">
        <div className={styles.summaryInner}>
          <h1 id="subscribe-title">Summary</h1>

          <dl className={styles.planSummary}>
            <div>
              <dt>
                Plan
                <span>{plan.label}</span>
              </dt>
              <dd>
                <Link href="/signup?step=plan">Change</Link>
                <span>{plan.price}</span>
              </dd>
            </div>
          </dl>

          <div className={styles.creditRow}>
            <span>{"\u20B1"}300</span>
            <p><strong>{plan.summary}</strong> Subscription billed normally.</p>
          </div>

          <dl className={styles.totalRows}>
            <div>
              <dt>Subscription</dt>
              <dd>{isCustomPlan ? "Pending" : plan.dueToday}</dd>
            </div>
            <div>
              <dt>Taxes</dt>
              <dd>{isCustomPlan ? "Pending" : "\u20B10.00"}</dd>
            </div>
            <div className={styles.totalDue}>
              <dt>Due today</dt>
              <dd>{plan.dueToday}</dd>
            </div>
          </dl>

          <p className={styles.summaryNote}>
            Monthly usage will be calculated at the end of the billing cycle, with any overage added to your next invoice. Payment is processed securely.
          </p>
        </div>
      </aside>
    </main>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<PipelineLoader label="Preparing payment" />}>
      <SubscribePaymentPage />
    </Suspense>
  );
}
