import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { OAuthAuthPage } from "../../src/features/public-site/auth/oauth-auth-page";
import { useAuthSession } from "../../src/hooks/use-auth-session";
import {
  checkEmailSignupAvailability,
  createGitHubLoginUrl,
  startEmailSignup,
  verifyEmailSignupCode,
  warmupBackend,
} from "../../src/lib/api/client";
import { ApiError } from "../../src/lib/api/request";

const replaceMock = jest.fn();
const pushMock = jest.fn();
let searchParamsValue = "next=/home";
let reducedMotion = true;
const motionValueSets: jest.Mock[] = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react") as typeof import("react");
  const framerOnlyProps = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "style",
  ]);

  const motion = new Proxy(
    {},
    {
      get(_target, tag) {
        return function MotionMock({
          children,
          ...props
        }: { children?: React.ReactNode } & Record<string, unknown>) {
          const domProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (!framerOnlyProps.has(key)) domProps[key] = value;
          }
          return React.createElement(String(tag), domProps, children);
        };
      },
    },
  );

  return {
    motion,
    useMotionValue: () => {
      const set = jest.fn();
      motionValueSets.push(set);
      return { set };
    },
    useReducedMotion: () => reducedMotion,
    useSpring: (value: unknown) => value,
    useTransform: () => ({}),
    useScroll: () => ({ scrollYProgress: {} }),
  };
});

jest.mock("../../src/components/layout/flow-background", () => ({
  FlowBackground: () => <div data-testid="flow-background" />,
}));

jest.mock("../../src/hooks/use-auth-session", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("../../src/lib/api/client", () => ({
  createGitHubLoginUrl: jest.fn((returnTo: string) =>
    `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`),
  createGoogleLoginUrl: (returnTo: string) =>
    `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
  loginWithEmail: jest
    .fn()
    .mockResolvedValue({ ok: true, authenticated: true }),
  resendEmailSignupCode: jest
    .fn()
    .mockResolvedValue({ ok: true, verificationRequired: true }),
  startEmailSignup: jest
    .fn()
    .mockResolvedValue({ ok: true, verificationRequired: true }),
  verifyEmailSignupCode: jest
    .fn()
    .mockResolvedValue({ ok: true, authenticated: true }),
  checkEmailSignupAvailability: jest
    .fn()
    .mockResolvedValue({ ok: true, available: true }),
  warmupBackend: jest.fn().mockResolvedValue(undefined),
}));

const mockedUseAuthSession = useAuthSession as jest.MockedFunction<
  typeof useAuthSession
>;
const mockedWarmupBackend = warmupBackend as jest.MockedFunction<
  typeof warmupBackend
>;
const mockedCheckEmailSignupAvailability =
  checkEmailSignupAvailability as jest.MockedFunction<
    typeof checkEmailSignupAvailability
  >;
const mockedCreateGitHubLoginUrl =
  createGitHubLoginUrl as jest.MockedFunction<typeof createGitHubLoginUrl>;
const mockedStartEmailSignup = startEmailSignup as jest.MockedFunction<
  typeof startEmailSignup
>;
const mockedVerifyEmailSignupCode =
  verifyEmailSignupCode as jest.MockedFunction<typeof verifyEmailSignupCode>;

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

function renderSignup() {
  return render(
    <OAuthAuthPage
      mode="signup"
      title="Create your AlphaCI workspace."
      subtitle="Start with GitHub and generate your first governed workflow in minutes."
      switchText="Already have an account?"
      switchHref="/login"
      switchCta="Sign in"
    />,
  );
}

describe("OAuth auth page migration", () => {
  let root: Root | null = null;

  beforeEach(() => {
    replaceMock.mockClear();
    searchParamsValue = "next=/home";
    reducedMotion = true;
    motionValueSets.length = 0;
    mockedCheckEmailSignupAvailability.mockResolvedValue({
      ok: true,
      available: true,
    });
    mockedUseAuthSession.mockReturnValue({
      status: "signed-out",
      session: null,
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-theme");
    jest.clearAllMocks();
  });

  it("renders the signup auth surface from the feature module", () => {
    const result = renderSignup();
    root = result.root;

    expect(
      result.container.querySelector("main")?.getAttribute("data-auth-page"),
    ).toBe("signup");
    expect(result.container.querySelector("header")).toBeNull();
    expect(
      Array.from(result.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Continue with GitHub"),
      ),
    ).not.toBeNull();
    expect(
      result.container.querySelector("a[href='/login']"),
    ).toHaveTextContent("Sign in");
    expect(result.container).toHaveTextContent("Secure workspace access");
    expect(result.container).toHaveTextContent("Source-backed YAML generation");
  });

  it("sends GitHub signup callbacks to plan selection before payment", () => {
    const result = renderSignup();
    root = result.root;

    expect(mockedCreateGitHubLoginUrl).toHaveBeenLastCalledWith(
      "http://localhost/auth/callback?intent=signup&next=%2Fsignup%3Fstep%3Dplan&popup=1&provider=github",
    );
  });
  it("recovers GitHub App callbacks that land directly on signup", () => {
    searchParamsValue = "installation_id=12345&setup_action=install";

    const result = renderSignup();
    root = result.root;

    const switchLink = Array.from(result.container.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Sign in"),
    );

    expect(switchLink).toHaveAttribute(
      "href",
      "/login?next=%2Fonboarding%3Finstallation_id%3D12345%26setup_action%3Dinstall",
    );
  });
  it("posts GitHub App callbacks from the signup popup to the opener", () => {
    searchParamsValue = "next=%2Fonboarding%3Finstallation_id%3D12345%26setup_action%3Dinstall";
    const postMessage = jest.fn();
    Object.defineProperty(window, "opener", {
      value: { postMessage },
      configurable: true,
    });

    const result = renderSignup();
    root = result.root;

    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "alphaci:github-installation",
        installationId: 12345,
        setupAction: "install",
      },
      "http://localhost",
    );
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "alphaci:github-installation",
        installationId: 12345,
        setupAction: "install",
      },
      "http://127.0.0.1",
    );
  });
  it("preserves next when switching between signup and login", () => {
    searchParamsValue = "next=%2Fonboarding%3Finstallation_id%3D12345%26setup_action%3Dinstall";

    const result = renderSignup();
    root = result.root;

    const switchLink = Array.from(result.container.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Sign in"),
    );

    expect(switchLink).toHaveAttribute(
      "href",
      "/login?next=%2Fonboarding%3Finstallation_id%3D12345%26setup_action%3Dinstall",
    );
  });
  it("renders login mode, pointer handlers, and auth link interactions", async () => {
    reducedMotion = false;
    const result = render(
      <OAuthAuthPage
        mode="login"
        title="Sign in to your AlphaCI workspace."
        subtitle="Connect GitHub to keep building, exporting, and deploying workflows."
        switchText="New here?"
        switchHref="/signup"
        switchCta="Create your account"
      />,
    );
    root = result.root;

    const githubButton = Array.from(
      result.container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Continue with GitHub"))!;
    expect(githubButton).toHaveTextContent("Continue with GitHub");

    const card = result.container.querySelector("main")?.lastElementChild
      ?.firstElementChild as HTMLElement;
    card.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    act(() => {
      card.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 75,
          clientY: 25,
        }),
      );
      card.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      githubButton.dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true }),
      );
      githubButton.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await act(async () => {
      githubButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      await Promise.resolve();
    });
    consoleErrorSpy.mockRestore();

    expect(mockedWarmupBackend).toHaveBeenCalledTimes(1);
  });

  it("opens GitHub authentication in the centered connection popup", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const result = renderSignup();
    root = result.root;

    const githubButton = Array.from(result.container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Continue with GitHub"),
    )!;

    await act(async () => {
      githubButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/github"),
      "alphaci-github-auth",
      expect.stringContaining("popup=yes,width=560,height=720"),
    );
    expect(mockedWarmupBackend).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("verifies email before showing the paid plan selector", async () => {
    const result = renderSignup();
    root = result.root;

    const firstName = result.container.querySelector<HTMLInputElement>(
      'input[name="firstName"]',
    )!;
    const lastName = result.container.querySelector<HTMLInputElement>(
      'input[name="lastName"]',
    )!;
    const email = result.container.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    firstName.value = "Test";
    lastName.value = "User";
    email.value = "new@example.com";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.container).toHaveTextContent("Secure your account");
    expect(result.container).not.toHaveTextContent("Select a plan");
    expect(result.container.querySelector('input[name="signupPlan"]')).toBeNull();

    const password = result.container.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;
    password.value = "password123";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedStartEmailSignup).toHaveBeenCalledWith({
      firstName: "Test",
      lastName: "User",
      email: "new@example.com",
      password: "password123",
    });
    expect(result.container.querySelector("main")).toHaveAttribute(
      "data-auth-step",
      "verify",
    );
    expect(result.container.querySelector("aside")).toBeNull();

    const codeInputs = Array.from(
      result.container.querySelectorAll<HTMLInputElement>(
        'input[aria-label^="Email verification code digit"]',
      ),
    );
    expect(codeInputs).toHaveLength(6);

    const inputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      "123456".split("").forEach((digit, index) => {
        inputValueSetter?.call(codeInputs[index], digit);
        codeInputs[index].dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true }),
        );
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedVerifyEmailSignupCode).toHaveBeenCalledWith({
      email: "new@example.com",
      code: "123456",
    });
    expect(result.container).toHaveTextContent("Select a plan");
    expect(result.container).toHaveTextContent("Starter");
    expect(result.container).toHaveTextContent("Continue to payment");
    expect(result.container.querySelector('input[name="password"]')).toBeNull();
    const selectedPlan = result.container.querySelector<HTMLInputElement>(
      'input[name="signupPlan"][value="starter"]',
    );
    expect(selectedPlan).toBeChecked();

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(pushMock).toHaveBeenCalledWith("/subscribe?plan=starter");
    expect(replaceMock).not.toHaveBeenCalledWith("/subscribe");
  });
  it("refreshes the auth session after email verification before plan payment navigation", async () => {
    const refreshMock = jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } });
    mockedUseAuthSession.mockReturnValue({
      status: "signed-out",
      session: null,
      error: null,
      refresh: refreshMock,
    });
    const result = renderSignup();
    root = result.root;

    const firstName = result.container.querySelector<HTMLInputElement>(
      'input[name="firstName"]',
    )!;
    const lastName = result.container.querySelector<HTMLInputElement>(
      'input[name="lastName"]',
    )!;
    const email = result.container.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    firstName.value = "Test";
    lastName.value = "User";
    email.value = "new@example.com";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    const password = result.container.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )!;
    password.value = "CorrectHorse123!";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    const codeInputs = Array.from(
      result.container.querySelectorAll<HTMLInputElement>(
        'input[aria-label^="Email verification code digit"]',
      ),
    );
    const inputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      "123456".split("").forEach((digit, index) => {
        inputValueSetter?.call(codeInputs[index], digit);
        codeInputs[index].dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true }),
        );
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedVerifyEmailSignupCode).toHaveBeenCalledWith({
      email: "new@example.com",
      code: "123456",
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.container).toHaveTextContent("Select a plan");
  });
  it("stops signup when the email is already registered", async () => {
    mockedCheckEmailSignupAvailability.mockRejectedValueOnce(
      new ApiError("Request failed with status 409", 409),
    );
    const result = renderSignup();
    root = result.root;

    const firstName = result.container.querySelector<HTMLInputElement>(
      'input[name="firstName"]',
    )!;
    const lastName = result.container.querySelector<HTMLInputElement>(
      'input[name="lastName"]',
    )!;
    const email = result.container.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    firstName.value = "Test";
    lastName.value = "User";
    email.value = "taken@example.com";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCheckEmailSignupAvailability).toHaveBeenCalledWith(
      "taken@example.com",
    );
    expect(result.container).toHaveTextContent(
      "An account already exists. Sign in instead.",
    );
    expect(result.container.querySelector('input[name="password"]')).toBeNull();
  });
  it("continues signup when the email availability check is temporarily unavailable", async () => {
    mockedCheckEmailSignupAvailability.mockRejectedValueOnce(
      new ApiError("Request failed with status 503", 503),
    );
    const result = renderSignup();
    root = result.root;

    const firstName = result.container.querySelector<HTMLInputElement>(
      'input[name="firstName"]',
    )!;
    const lastName = result.container.querySelector<HTMLInputElement>(
      'input[name="lastName"]',
    )!;
    const email = result.container.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    firstName.value = "Test";
    lastName.value = "User";
    email.value = "new@example.com";

    await act(async () => {
      result.container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCheckEmailSignupAvailability).toHaveBeenCalledWith(
      "new@example.com",
    );
    expect(result.container).not.toHaveTextContent(
      "We could not check that email. Please try again.",
    );
    expect(result.container).toHaveTextContent("Secure your account");
    expect(result.container.querySelector('input[name="password"]')).not.toBeNull();
  });

  it("does not show the current-session check copy", () => {
    mockedUseAuthSession.mockReturnValue({
      status: "loading",
      session: null,
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = renderSignup();
    root = result.root;

    expect(result.container).not.toHaveTextContent("Checking current session");
  });
  it("redirects signed-in signup users to plan selection before payment", () => {
    searchParamsValue = "next=https://example.com/phish";
    mockedCheckEmailSignupAvailability.mockResolvedValue({
      ok: true,
      available: true,
    });
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: {
        authenticated: true,
        user: { id: "user-1", login: "tone" },
        subscription: {
          plan: "free",
          status: "active",
          provider: "mock",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = renderSignup();
    root = result.root;

    expect(replaceMock).toHaveBeenCalledWith("/signup?step=plan");
    expect(replaceMock).not.toHaveBeenCalledWith("/subscribe");
  });

  it("redirects signed-in login users without a paid plan to plan selection before payment", () => {
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: {
        authenticated: true,
        user: { id: "user-1", login: "tone" },
        subscription: {
          plan: "free",
          status: "active",
          provider: "mock",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = render(
      <OAuthAuthPage
        mode="login"
        title="Sign in to your AlphaCI workspace."
        subtitle="Connect GitHub to keep building, exporting, and deploying workflows."
        switchText="New here?"
        switchHref="/signup"
        switchCta="Create your account"
      />,
    );
    root = result.root;

    expect(replaceMock).toHaveBeenCalledWith("/signup?step=plan");
    expect(replaceMock).not.toHaveBeenCalledWith("/subscribe");
  });
  it("renders the plan selector when signed-in users change plans from checkout", () => {
    searchParamsValue = "step=plan";
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: {
        authenticated: true,
        user: { id: "user-1", login: "tone" },
        subscription: {
          plan: "free",
          status: "active",
          provider: "mock",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = renderSignup();
    root = result.root;

    expect(replaceMock).not.toHaveBeenCalledWith("/subscribe");
    expect(result.container).toHaveTextContent("Select a plan");
    expect(result.container).toHaveTextContent("Continue to payment");
  });

  it("makes the selected plan card visibly explicit", () => {
    searchParamsValue = "step=plan";
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: {
        authenticated: true,
        user: { id: "user-1", login: "tone", onboardingCompleted: false },
        subscription: {
          plan: "free",
          status: "active",
          provider: "mock",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = renderSignup();
    root = result.root;

    expect(result.container).not.toHaveTextContent("Self-serve checkout");
    expect(result.container).toHaveTextContent("Paid monthly");
    expect(result.container).toHaveTextContent("Selected");
    expect(
      result.container.querySelector('label[data-selected="true"]'),
    ).toHaveTextContent("Starter");
  });
  it("redirects signed-in signup users to plan selection before payment when requested", () => {
    searchParamsValue = "next=%2Fsignup%3Fstep%3Dplan";
    mockedUseAuthSession.mockReturnValue({
      status: "signed-in",
      session: {
        authenticated: true,
        user: { id: "user-1", login: "tone", onboardingCompleted: false },
        subscription: {
          plan: "free",
          status: "active",
          provider: "mock",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      error: null,
      refresh: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "user-1", login: "tone" } }),
    });

    const result = renderSignup();
    root = result.root;

    expect(replaceMock).toHaveBeenCalledWith("/signup?step=plan");
    expect(replaceMock).not.toHaveBeenCalledWith("/subscribe");
  });

  it("keeps desktop auth overflow isolated to the form panel", () => {
    const pageStyles = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/features/public-site/auth/oauth-auth-page.styles.ts",
      ),
      "utf8",
    );

    expect(pageStyles).toContain("authShell:");
    expect(pageStyles).toContain("h-dvh");
    expect(pageStyles).toContain("overflow-hidden");
    expect(pageStyles).toContain("formPanel:");
    expect(pageStyles).toContain("overflow-y-auto");
    expect(pageStyles).toContain("[scrollbar-width:none]");
    expect(pageStyles).toContain("[&::-webkit-scrollbar]:hidden");
    expect(pageStyles).toContain("legacyPanel:");
  });
  it("keeps auth routes thin and feature-owned", () => {
    const loginRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/login/page.tsx"),
      "utf8",
    );
    const signupRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/signup/page.tsx"),
      "utf8",
    );
    const featureSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/features/public-site/auth/oauth-auth-page.tsx",
      ),
      "utf8",
    );

    expect(loginRoute).toContain("@/features/public-site/auth/oauth-auth-page");
    expect(signupRoute).toContain(
      "@/features/public-site/auth/oauth-auth-page",
    );
    expect(featureSource).toContain("oauth-auth-page.styles");
    expect(featureSource).toContain("oauth-auth-card.styles");
    expect(featureSource).not.toContain('className="auth-');
    expect(featureSource).not.toContain('className="hero-kicker"');
    expect(featureSource).not.toMatch(/[\u00e2\u00c2]/);
  });
});
