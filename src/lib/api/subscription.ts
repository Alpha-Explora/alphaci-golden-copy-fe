import type {
  SubscriptionCheckoutResponse,
  SubscriptionCheckoutStatusResponse,
  SubscriptionInfo,
  SubscriptionPaymentIntentResponse,
  SubscriptionPaymentIntentStatusResponse,
} from "./contracts";
import { request } from "./request";

export type SubscriptionHostedPaymentMethod = "ewallets";

export async function createSubscriptionCheckout(
  plan: "pro",
  paymentMethod?: SubscriptionHostedPaymentMethod,
): Promise<SubscriptionCheckoutResponse> {
  return request<SubscriptionCheckoutResponse>("/subscription/checkout", {
    method: "POST",
    body: JSON.stringify(paymentMethod ? { plan, paymentMethod } : { plan }),
  });
}

export async function getCheckoutStatus(
  checkoutId: string,
): Promise<SubscriptionCheckoutStatusResponse> {
  return request<SubscriptionCheckoutStatusResponse>(
    `/subscription/checkout/${encodeURIComponent(checkoutId)}/status`,
  );
}

export async function createSubscriptionPaymentIntent(
  plan: "pro",
  paymentMethod: "card" | "gcash" | "paymaya" | "qrph" = "card",
): Promise<SubscriptionPaymentIntentResponse> {
  return request<SubscriptionPaymentIntentResponse>(
    "/subscription/payment-intent",
    {
      method: "POST",
      body: JSON.stringify({ plan, paymentMethod }),
    },
  );
}

export async function cancelSubscriptionPaymentIntent(
  paymentIntentId: string,
): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/subscription/payment-intent/${encodeURIComponent(paymentIntentId)}/cancel`,
    { method: "POST" },
  );
}

export async function getPaymentIntentStatus(
  paymentIntentId: string,
): Promise<SubscriptionPaymentIntentStatusResponse> {
  return request<SubscriptionPaymentIntentStatusResponse>(
    `/subscription/payment-intent/${encodeURIComponent(paymentIntentId)}/status`,
  );
}

export async function activateMonthlySubscription(plan: "pro"): Promise<SubscriptionInfo> {
  const response = await request<{ subscription: SubscriptionInfo }>("/subscription/monthly/activate", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });

  return response.subscription;
}

export async function cancelMonthlySubscription(): Promise<SubscriptionInfo> {
  const response = await request<{ subscription: SubscriptionInfo }>("/subscription/monthly/cancel", {
    method: "POST",
  });

  return response.subscription;
}
