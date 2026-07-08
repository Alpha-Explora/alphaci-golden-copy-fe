"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/brand";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  createSubscriptionPaymentIntent,
  getPaymentIntentStatus,
} from "@/lib/api/client";
import { hasActiveSubscription } from "@/lib/auth/subscription";
import { ApiError } from "@/lib/api/request";

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

const PAYMONGO_DOCUMENTED_TEST_CARD_NUMBERS = new Set(["5123000000000002"]);

type SubscribePlanId = "starter" | "growth" | "business";

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

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof PayMongoRequestError) {
    const firstError = error.payload.errors?.[0];
    const detail = getPayMongoErrorDetail(firstError);
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

function SubscribePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, session, refresh } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [cardDigits, setCardDigits] = useState("");
  const [expirationDigits, setExpirationDigits] = useState("");
  const [securityCode, setSecurityCode] = useState("");

  const selectedPlan = useMemo(
    () => getPlan(searchParams.get("plan")),
    [searchParams],
  );
  const returningPaymentIntentId = searchParams.get("payment_intent");
  const plan = planCopy[selectedPlan];
  const isCustomPlan = selectedPlan !== "starter";
  const defaultName = session?.user.name ?? session?.user.login ?? "";
  const defaultEmail = session?.user.email ?? "";
  const hasSubscription = hasActiveSubscription(session);
  const cardNumber = groupCardDigits(cardDigits);
  const expirationDate = formatExpiry(expirationDigits);
  const cardNumberError = cardDigits.length >= 13 && !isValidCardNumber(cardDigits) ? "Your card number is invalid." : null;

  useEffect(() => {
    if (!defaultName) return;
    setBillingName((current) => current || defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (!defaultEmail) return;
    setBillingEmail((current) => current || defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (status !== "signed-out") return;
    const params = new URLSearchParams({
      next: `/subscribe?plan=${selectedPlan}`,
    });
    router.replace(`/signup?${params.toString()}`);
  }, [router, selectedPlan, status]);

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
              name: String(formData.get("billingName") ?? defaultName),
              email: String(formData.get("billingEmail") ?? defaultEmail),
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
    const returnUrl = `${window.location.origin}/subscribe?${params.toString()}`;
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutMessage(null);

    if (isCustomPlan) return;

    if (hasSubscription) {
      router.push("/settings?billing=active");
      return;
    }

    if (cardNumberError || !isValidCardNumber(cardDigits)) {
      setCheckoutMessage("Your card number is invalid.");
      return;
    }

    if (!getPayMongoPublicKey()) {
      setCheckoutMessage("Payment checkout is not configured.");
      return;
    }

    if (expirationDigits.length !== 4) {
      setCheckoutMessage("Enter a valid expiration date.");
      return;
    }

    if (securityCode.length < 3) {
      setCheckoutMessage("Enter a valid security code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
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
        const detail = getPayMongoErrorDetail(attributes?.last_payment_error);
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

  if (status === "loading" || status === "signed-out") {
    return <PipelineLoader label="Preparing payment" />;
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

          <form className={styles.form} onSubmit={handleSubmit}>
            <CheckoutField htmlFor="billing-name" label="Billing name">
              <CheckoutInput
                autoComplete="name"
                id="billing-name"
                name="billingName"
                onChange={(event) => setBillingName(event.target.value)}
                required
                value={billingName}
              />
            </CheckoutField>

            <CheckoutField
              description="Where invoices get sent. This can be different from your account email address."
              htmlFor="billing-email"
              label="Billing email"
            >
              <CheckoutInput
                autoComplete="email"
                id="billing-email"
                name="billingEmail"
                onChange={(event) => setBillingEmail(event.target.value)}
                required
                type="email"
                value={billingEmail}
              />
            </CheckoutField>

            <fieldset className={styles.addressGroup}>
              <legend>Billing address</legend>
              <CheckoutInput name="addressLine1" placeholder="Address line 1" />
              <CheckoutInput name="addressLine2" placeholder="Address line 2" />
              <CheckoutInput name="city" placeholder="City" />
              <div className={styles.twoColumnFields}>
                <CheckoutInput name="state" placeholder="State/province" />
                <CheckoutInput name="zip" placeholder="ZIP code" />
              </div>
              <CheckoutSelect name="country" defaultValue="">
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
            </fieldset>

            <CheckoutField error={cardNumberError} htmlFor="card-number" label="Card number">
              <PaymentInputShell variant="card" suffix={<CardBrandMarks />}>
                <CheckoutInput
                  aria-describedby={cardNumberError ? "card-number-error" : undefined}
                  aria-invalid={Boolean(cardNumberError)}
                  autoComplete="cc-number"
                  id="card-number"
                  inputMode="numeric"
                  name="cardNumber"
                  onChange={(event) => setCardDigits(onlyDigits(event.target.value, 16))}
                  pattern="[0-9 ]*"
                  placeholder="1234 1234 1234 1234"
                  value={cardNumber}
                />
              </PaymentInputShell>
            </CheckoutField>

            <div className={styles.twoColumnFields}>
              <CheckoutField htmlFor="expiration" label="Expiration date">
                <CheckoutInput
                  autoComplete="cc-exp"
                  id="expiration"
                  inputMode="numeric"
                  maxLength={7}
                  name="expiration"
                  onChange={(event) => setExpirationDigits(onlyDigits(event.target.value, 4))}
                  pattern="[0-9 /]*"
                  placeholder="MM / YY"
                  value={expirationDate}
                />
              </CheckoutField>
              <CheckoutField htmlFor="security-code" label="Security code">
                <PaymentInputShell variant="cvc" suffix={<CvcIcon />}>
                  <CheckoutInput
                    autoComplete="cc-csc"
                    id="security-code"
                    inputMode="numeric"
                    maxLength={3}
                    name="securityCode"
                    onChange={(event) => setSecurityCode(onlyDigits(event.target.value, 3))}
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
          </form>

          <p className={styles.secureCopy}>
            <SecureShieldIcon />
            Card details are encrypted and never stored by AlphaCI.
          </p>
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
