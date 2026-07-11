import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import SubscribePage from "../../src/features/dashboard/subscribe/subscribe-page";
import { useAuthSession } from "../../src/hooks/use-auth-session";
import { createSubscriptionCheckout, createSubscriptionPaymentIntent, getPaymentIntentStatus } from "../../src/lib/api/client";
import type { AuthMeResponse } from "../../src/lib/api/contracts";

const pushMock = jest.fn();
const replaceMock = jest.fn();
let searchParamsValue = "plan=starter";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

jest.mock("../../src/components/brand", () => ({
  Logo: () => <span data-testid="logo" />,
}));

jest.mock("../../src/hooks/use-auth-session", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("../../src/lib/api/client", () => ({
  createSubscriptionCheckout: jest.fn(),
  createSubscriptionPaymentIntent: jest.fn(),
  getPaymentIntentStatus: jest.fn(),
}));

const mockedUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockedCreateSubscriptionCheckout = createSubscriptionCheckout as jest.MockedFunction<typeof createSubscriptionCheckout>;
const mockedCreateSubscriptionPaymentIntent = createSubscriptionPaymentIntent as jest.MockedFunction<typeof createSubscriptionPaymentIntent>;
const mockedGetPaymentIntentStatus = getPaymentIntentStatus as jest.MockedFunction<typeof getPaymentIntentStatus>;
const originalPaymongoPublicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
const originalFetch = global.fetch;

const successfulPayMongoCards = [
  ["4343434343434345", "Visa"],
  ["4571736000000075", "Visa"],
  ["5123000000000002", "Mastercard"],
  ["5123000000000001", "Mastercard"],
] as const;

const declinedPayMongoCards = [
  ["4200000000000018", "The card has expired."],
  ["4300000000000017", "The CVC is invalid."],
  ["5100000000000198", "Insufficient funds."],
  ["4111111111111111", "The card was declined."],
] as const;

const signedInSession: AuthMeResponse = {
  authenticated: true,
  user: {
    id: "user-1",
    login: "antoneeeeetorres",
    name: "Anthony Torres",
    email: "antoneeeeetorres@gmail.com",
    onboardingCompleted: false,
  },
  subscription: {
    plan: "free",
    status: "active",
    provider: "mock",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
};

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function renderSubscribePage() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<SubscribePage />);
  });
  await flushEffects();

  return { container, root };
}

function mockPaymentIntent() {
  mockedCreateSubscriptionPaymentIntent.mockResolvedValue({
    paymentIntentId: "pi_paymongo_123",
    clientKey: "pi_client_key_123",
    status: "awaiting_payment_method",
  });
}

function mockActiveSubscriptionStatus() {
  mockedGetPaymentIntentStatus.mockResolvedValue({
    status: "succeeded",
    subscription: {
      plan: "pro",
      status: "active",
      provider: "paymongo",
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
  });
}

async function fillPaymentForm(
  container: HTMLElement,
  cardNumber: string,
  cvc = "321",
  options: { billingDetails?: boolean } = {},
) {
  const { billingDetails = true } = options;

  await showCardPaymentForm(container);

  await act(async () => {
    if (billingDetails) {
      setInputValue(container.querySelector<HTMLInputElement>("#billing-name")!, "Anthony Torres");
      setInputValue(container.querySelector<HTMLInputElement>("#billing-email")!, "billing@example.com");
      setInputValue(container.querySelector<HTMLInputElement>("#address-line-1")!, "123 Test Street");
      setInputValue(container.querySelector<HTMLInputElement>("#city")!, "Makati");
      setInputValue(container.querySelector<HTMLInputElement>("#state")!, "Metro Manila");
      setInputValue(container.querySelector<HTMLInputElement>("#zip")!, "1200");
      setSelectValue(container.querySelector<HTMLSelectElement>("#country")!, "PH");
    }

    setInputValue(container.querySelector<HTMLInputElement>("#card-number")!, cardNumber);
    setInputValue(container.querySelector<HTMLInputElement>("#expiration")!, "12 / 31");
    setInputValue(container.querySelector<HTMLInputElement>("#security-code")!, cvc);
  });
}
async function choosePaymentMethod(container: HTMLElement, method: "E-Wallets" | "QR Ph" | "Card") {
  const labelByMethod = {
    Card: "Credit or Debit Card",
    "E-Wallets": "E-Wallets",
    "QR Ph": "Scan to Pay",
  } as const;

  await act(async () => {
    container.querySelector<HTMLInputElement>(`input[aria-label="${labelByMethod[method]}"]`)?.click();
  });

  await submitPaymentForm(container);
}

async function showCardPaymentForm(container: HTMLElement) {
  if (!container.querySelector<HTMLInputElement>("#card-number")) {
    await choosePaymentMethod(container, "Card");
  }
}

async function submitPaymentForm(container: HTMLElement) {
  await act(async () => {
    container.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Subscribe payment page", () => {
  let root: Root | null = null;

  beforeEach(() => {
    searchParamsValue = "plan=starter";
    pushMock.mockClear();
    replaceMock.mockClear();
    process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY = "pk_test_123";
    mockedCreateSubscriptionCheckout.mockReset();
    mockedCreateSubscriptionPaymentIntent.mockReset();
    mockedGetPaymentIntentStatus.mockReset();
    global.fetch = jest.fn();
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: signedInSession,
      error: null,
      refresh: jest.fn().mockResolvedValue(signedInSession),
    });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    if (originalPaymongoPublicKey === undefined) {
      delete process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
    } else {
      process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY = originalPaymongoPublicKey;
    }
    if (originalFetch === undefined) {
      delete (global as Partial<typeof globalThis>).fetch;
    } else {
      global.fetch = originalFetch;
    }
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("rechecks the session before showing payment for signed-out visits", async () => {
    let currentAuth = {
      status: "signed-out" as const,
      session: null,
      error: null,
      refresh: jest.fn(async () => {
        currentAuth = {
          ...currentAuth,
          status: "signed-in" as const,
          session: signedInSession,
        };
        return signedInSession;
      }),
    };
    mockedUseAuthSession.mockImplementation(() => currentAuth);

    const rendered = await renderSubscribePage();
    root = rendered.root;

    expect(rendered.container).toHaveTextContent("Choose payment method");
    expect(currentAuth.refresh).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalledWith("/signup?next=%2Fsubscribe%3Fplan%3Dstarter");
  });
  it("does not redirect to signup after the payment session recheck still finds no session", async () => {
    const refreshMock = jest.fn().mockResolvedValue(undefined);
    mockedUseAuthSession.mockReturnValue({
      status: "signed-out",
      session: null,
      error: null,
      refresh: refreshMock,
    });

    const rendered = await renderSubscribePage();
    root = rendered.root;

    expect(rendered.container).toHaveTextContent("Returning to AlphaCI");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalledWith("/signup?next=%2Fsubscribe%3Fplan%3Dstarter");
  });
  it("does not restart the signed-out recheck while the session hook is loading", async () => {
    let currentAuth = {
      status: "signed-out" as const,
      session: null,
      error: null,
      refresh: jest.fn(() => {
        currentAuth = {
          ...currentAuth,
          status: "loading" as const,
        };
        return new Promise<void>(() => undefined);
      }),
    };
    mockedUseAuthSession.mockImplementation(() => currentAuth);

    const rendered = await renderSubscribePage();
    root = rendered.root;

    expect(currentAuth.refresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      root?.render(<SubscribePage />);
    });
    await flushEffects();

    currentAuth = {
      ...currentAuth,
      status: "signed-out" as const,
    };

    await act(async () => {
      root?.render(<SubscribePage />);
    });
    await flushEffects();

    expect(rendered.container).toHaveTextContent("Preparing payment");
    expect(currentAuth.refresh).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });
  it("does not redirect to signup when payment session verification fails", async () => {
    mockedUseAuthSession.mockReturnValue({
      status: "error",
      session: null,
      error: "Unable to verify your session right now.",
      refresh: jest.fn().mockResolvedValue(signedInSession),
    });

    const rendered = await renderSubscribePage();
    root = rendered.root;

    expect(rendered.container).toHaveTextContent("Unable to verify your session right now.");
    expect(rendered.container).not.toHaveTextContent("Billing name");
    expect(replaceMock).not.toHaveBeenCalledWith("/signup?next=%2Fsubscribe%3Fplan%3Dstarter");
  });
  it("prefills billing email but not billing name from the signed-in session", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await showCardPaymentForm(rendered.container);

    expect(rendered.container.querySelector<HTMLInputElement>("#billing-name")?.value).toBe("");
    expect(rendered.container.querySelector<HTMLInputElement>("#billing-email")?.value).toBe("antoneeeeetorres@gmail.com");
    expect(rendered.container).toHaveTextContent("Card details are encrypted and never stored by AlphaCI.");
    expect(rendered.container).not.toHaveTextContent("PayMongo");
  });



  it("keeps E-Wallets in AlphaCI before the provider authorization redirect", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    expect(
      Array.from(rendered.container.querySelectorAll<HTMLElement>("[data-payment-method-option]")).map((option) => option.dataset.paymentMethodOption),
    ).toEqual(["card", "ewallets", "qrph"]);
    expect(rendered.container.querySelector<HTMLInputElement>('input[aria-label="E-Wallets"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-payment-method-option="ewallets"] img[alt="GCash"]')?.getAttribute("src")).toBe("/payment-logos/gcash.svg");
    expect(rendered.container.querySelector('[data-payment-method-option="ewallets"] img[alt="Maya"]')?.getAttribute("src")).toBe("/payment-logos/maya.svg");

    await choosePaymentMethod(rendered.container, "E-Wallets");

    expect(rendered.container).toHaveTextContent("Choose an e-wallet");
    expect(rendered.container.querySelector<HTMLInputElement>('input[aria-label="GCash"]')).not.toBeNull();
    expect(rendered.container.querySelector<HTMLInputElement>('input[aria-label="Maya"]')).not.toBeNull();
    expect(mockedCreateSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it("keeps the custom billing form for Card and can go back to method selection", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await showCardPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("Billing name");
    expect(rendered.container.querySelector<HTMLInputElement>("#card-number")).not.toBeNull();
    expect(mockedCreateSubscriptionCheckout).not.toHaveBeenCalled();
    expect(mockedCreateSubscriptionPaymentIntent).not.toHaveBeenCalled();

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="payment-method-back"]')?.click();
    });

    expect(rendered.container).toHaveTextContent("Choose payment method");
    expect(rendered.container.querySelector<HTMLInputElement>("#card-number")).toBeNull();
  });



  it("generates a dynamic QR Ph code instead of redirecting to hosted checkout", async () => {
    mockedCreateSubscriptionPaymentIntent.mockResolvedValue({
      paymentIntentId: "pi_qrph_123",
      clientKey: "pi_client_key_123",
      status: "awaiting_payment_method",
    });
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "pm_qrph_123" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            attributes: {
              status: "awaiting_next_action",
              next_action: {
                code: { image_url: "data:image/png;base64,qrph" },
              },
            },
          },
        }),
      } as Response);
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await choosePaymentMethod(rendered.container, "QR Ph");

    expect(mockedCreateSubscriptionPaymentIntent).toHaveBeenCalledWith("pro", "qrph");
    expect(mockedCreateSubscriptionCheckout).not.toHaveBeenCalled();
    expect(rendered.container.querySelector('img[alt="QR Ph code for this payment"]')?.getAttribute("src")).toBe("data:image/png;base64,qrph");
    expect(rendered.container).toHaveTextContent("Waiting for payment confirmation");
  });

  it("shows exact required billing field errors before creating a payment intent", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await showCardPaymentForm(rendered.container);

    await act(async () => {
      setInputValue(rendered.container.querySelector<HTMLInputElement>("#card-number")!, "4343 4343 4343 4345");
      setInputValue(rendered.container.querySelector<HTMLInputElement>("#expiration")!, "12 / 31");
      setInputValue(rendered.container.querySelector<HTMLInputElement>("#security-code")!, "321");
    });

    await submitPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("Enter your billing name.");
    expect(rendered.container).toHaveTextContent("Enter your billing address.");
    expect(rendered.container).toHaveTextContent("Enter your billing city.");
    expect(rendered.container).toHaveTextContent("Enter your billing state or province.");
    expect(rendered.container).toHaveTextContent("Enter your ZIP or postal code.");
    expect(rendered.container).toHaveTextContent("Select your billing country.");
    expect(rendered.container.querySelector<HTMLInputElement>("#billing-name")?.getAttribute("aria-invalid")).toBe("true");
    expect(rendered.container.querySelector<HTMLInputElement>("#address-line-1")?.getAttribute("aria-invalid")).toBe("true");
    expect(mockedCreateSubscriptionPaymentIntent).not.toHaveBeenCalled();
  });

  it("blocks invalid card numbers before creating a PayMongo intent", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await showCardPaymentForm(rendered.container);

    const cardNumber = rendered.container.querySelector<HTMLInputElement>("#card-number");
    expect(cardNumber).not.toBeNull();

    await act(async () => {
      setInputValue(cardNumber!, "5100 0000 0000 0199");
    });

    await submitPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("Your card number is invalid.");
    expect(mockedCreateSubscriptionPaymentIntent).not.toHaveBeenCalled();
  });
  it("does not show a card-number error while the user is still typing", async () => {
    const rendered = await renderSubscribePage();
    root = rendered.root;

    await showCardPaymentForm(rendered.container);

    await act(async () => {
      setInputValue(rendered.container.querySelector<HTMLInputElement>("#card-number")!, "4343 4343 4343 43");
    });

    expect(rendered.container).not.toHaveTextContent("Your card number is invalid.");
    expect(mockedCreateSubscriptionPaymentIntent).not.toHaveBeenCalled();
  });

  it("uses provider-neutral copy while a payment is processing", async () => {
    mockedCreateSubscriptionPaymentIntent.mockReturnValue(new Promise(() => undefined));

    const rendered = await renderSubscribePage();
    root = rendered.root;

    await fillPaymentForm(rendered.container, "4343434343434345");
    await submitPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("Processing payment...");
    expect(rendered.container).not.toHaveTextContent("Processing with PayMongo");
  });

  it.each(successfulPayMongoCards)(
    "accepts PayMongo test card %s (%s) and completes payment setup",
    async (cardNumber) => {
      mockPaymentIntent();
      mockActiveSubscriptionStatus();
      jest.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: "pm_card_123" } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { attributes: { status: "succeeded" } } }),
        } as Response);

      const rendered = await renderSubscribePage();
      root = rendered.root;

      await fillPaymentForm(rendered.container, cardNumber);
      await submitPaymentForm(rendered.container);

      expect(rendered.container).not.toHaveTextContent("Your card number is invalid.");
      expect(mockedCreateSubscriptionPaymentIntent).toHaveBeenCalledWith("pro");
      expect(mockedGetPaymentIntentStatus).toHaveBeenCalledWith("pi_paymongo_123");
      expect(pushMock).toHaveBeenCalledWith("/subscribe/success?plan=starter");

      const paymentMethodRequest = jest.mocked(global.fetch).mock.calls[0]?.[1];
      const paymentMethodBody = JSON.parse(String(paymentMethodRequest?.body));
      expect(paymentMethodBody.data.attributes.details.card_number).toBe(cardNumber);
      expect(paymentMethodBody.data.attributes.details.exp_month).toBe(12);
      expect(paymentMethodBody.data.attributes.details.exp_year).toBe(2031);
      expect(paymentMethodBody.data.attributes.details.cvc).toBe("321");
    },
  );

  it("redirects the 3DS PayMongo test card to authorization", async () => {
    mockPaymentIntent();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "pm_card_3ds" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            attributes: {
              status: "awaiting_next_action",
              next_action: {
                redirect: {
                  url: "https://payments.test/authorize",
                },
              },
            },
          },
        }),
      } as Response);

    const rendered = await renderSubscribePage();
    root = rendered.root;

    await fillPaymentForm(rendered.container, "4120000000000007");
    await submitPaymentForm(rendered.container);

    expect(rendered.container).not.toHaveTextContent("Your card number is invalid.");
    const attachRequest = jest.mocked(global.fetch).mock.calls[1]?.[1];
    const attachBody = JSON.parse(String(attachRequest?.body));
    expect(attachBody.data.attributes.return_url).toBe("http://localhost/subscribe?plan=starter&payment_intent=pi_paymongo_123");
    expect(mockedGetPaymentIntentStatus).not.toHaveBeenCalled();
  });

  it.each(declinedPayMongoCards)(
    "shows provider-neutral decline detail for PayMongo test card %s",
    async (cardNumber, declineReason) => {
      mockPaymentIntent();
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      jest.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: "pm_card_declined" } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 402,
          json: async () => ({ errors: [{ detail: declineReason }] }),
        } as Response);

      const rendered = await renderSubscribePage();
      root = rendered.root;

      await fillPaymentForm(rendered.container, cardNumber);
      await submitPaymentForm(rendered.container);

      expect(rendered.container).toHaveTextContent(declineReason);
      expect(rendered.container).not.toHaveTextContent("Your card number is invalid.");
      expect(rendered.container).not.toHaveTextContent("PayMongo");
    },
  );

  it("shows provider-neutral card decline details", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockedCreateSubscriptionPaymentIntent.mockResolvedValue({
      paymentIntentId: "pi_paymongo_123",
      clientKey: "pi_client_key_123",
      status: "awaiting_payment_method",
    });
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "pm_card_123" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({ errors: [{ detail: "The card has expired." }] }),
      } as Response);

    const rendered = await renderSubscribePage();
    root = rendered.root;

    await fillPaymentForm(rendered.container, "4200000000000018", "312");
    await submitPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("The card has expired.");
    expect(rendered.container).not.toHaveTextContent("PayMongo payment confirmation failed");
  });
  it("does not expose raw payment intent state or processor ids", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockedCreateSubscriptionPaymentIntent.mockResolvedValue({
      paymentIntentId: "pi_paymongo_123",
      clientKey: "pi_client_key_123",
      status: "awaiting_payment_method",
    });
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "pm_card_123" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            {
              detail: "Payment intent with id pi_FrVDGAKfbGqQzcPnovhyswxK has already succeeded.",
            },
          ],
        }),
      } as Response);

    const rendered = await renderSubscribePage();
    root = rendered.root;

    await fillPaymentForm(rendered.container, "4343434343434345");
    await submitPaymentForm(rendered.container);

    expect(rendered.container).toHaveTextContent("This payment was already completed. Please refresh the page.");
    expect(rendered.container).not.toHaveTextContent("pi_FrVDGAKfbGqQzcPnovhyswxK");
    expect(rendered.container).not.toHaveTextContent("Payment intent with id");
  });
  it("surfaces unexpected PayMongo request errors instead of a vague fallback", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockedCreateSubscriptionPaymentIntent.mockResolvedValue({
      paymentIntentId: "pi_paymongo_123",
      clientKey: "pi_client_key_123",
      status: "awaiting_payment_method",
    });
    jest.mocked(global.fetch).mockRejectedValue(new Error("Failed to fetch"));

    const rendered = await renderSubscribePage();
    root = rendered.root;

    await fillPaymentForm(rendered.container, "4343434343434345");
    await submitPaymentForm(rendered.container);

    expect(mockedCreateSubscriptionPaymentIntent).toHaveBeenCalledWith("pro");
    expect(rendered.container).toHaveTextContent("Failed to fetch");
    expect(rendered.container).not.toHaveTextContent("PayMongo could not process this card. Please check the details and try again.");
  });
});
