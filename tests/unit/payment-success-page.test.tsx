import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import PaymentSuccessPage from "../../src/features/dashboard/subscribe/payment-success-page";
import { useAuthSession } from "../../src/hooks/use-auth-session";
import { getPaymentIntentStatus } from "../../src/lib/api/client";
import type { AuthMeResponse } from "../../src/lib/api/contracts";

const pushMock = jest.fn();
const replaceMock = jest.fn();
let searchParamsValue = "plan=starter&payment_intent=pi_paymongo_123";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

jest.mock("../../src/components/brand", () => ({
  Logo: () => <span data-testid="logo" />,
}));

jest.mock("../../src/components/layout/app-nav", () => ({
  AppNav: () => <nav data-testid="app-nav" />,
}));

jest.mock("../../src/components/layout/app-shell/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
  DashboardPageContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <main data-testid="dashboard-page-content">{children}</main>,
}));

jest.mock("../../src/components/layout/app-shell/setup-flow-surface", () => ({
  SetupFlowSurface: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="setup-flow-surface">{children}</section>
  ),
}));

jest.mock("../../src/components/layout/workspace-context", () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="workspace-provider">{children}</div>
  ),
}));

jest.mock("../../src/hooks/use-auth-session", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("../../src/lib/api/client", () => ({
  getPaymentIntentStatus: jest.fn(),
}));

jest.mock("../../src/lib/api/auth", () => ({
  logout: jest.fn(),
}));

const mockedUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockedGetPaymentIntentStatus = getPaymentIntentStatus as jest.MockedFunction<typeof getPaymentIntentStatus>;

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

async function renderPaymentSuccessPage() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<PaymentSuccessPage />);
  });

  return { container, root };
}

describe("Payment success page", () => {
  let root: Root | null = null;

  beforeEach(() => {
    searchParamsValue = "plan=starter&payment_intent=pi_paymongo_123";
    pushMock.mockClear();
    replaceMock.mockClear();
    mockedGetPaymentIntentStatus.mockReset();
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: signedInSession,
      error: null,
      refresh: jest.fn().mockResolvedValue({
        ...signedInSession,
        subscription: {
          ...signedInSession.subscription,
          plan: "pro",
          provider: "paymongo",
        },
      }),
    });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("confirms a returned payment intent before showing the billing success action", async () => {
    let resolveStatus!: (value: Awaited<ReturnType<typeof getPaymentIntentStatus>>) => void;
    mockedGetPaymentIntentStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );

    const rendered = await renderPaymentSuccessPage();
    root = rendered.root;

    expect(rendered.container).toHaveTextContent("Confirming payment");
    expect(rendered.container).not.toHaveTextContent("Get started");

    await act(async () => {
      resolveStatus({
        status: "succeeded",
        subscription: {
          plan: "pro",
          status: "active",
          provider: "paymongo",
          updatedAt: "2026-07-08T00:00:00.000Z",
        },
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetPaymentIntentStatus).toHaveBeenCalledWith("pi_paymongo_123");
    expect(mockedUseAuthSession.mock.results[0]?.value.refresh).toHaveBeenCalledTimes(1);
    expect(rendered.container).toHaveTextContent("Your Starter plan is active.");
    expect(rendered.container).toHaveTextContent("Get started");
  });
});