import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { OAuthAuthPage } from "../../src/features/public-site/auth/oauth-auth-page";
import { useAuthSession } from "../../src/hooks/use-auth-session";
import { warmupBackend } from "../../src/lib/api/client";

const replaceMock = jest.fn();
let searchParamsValue = "next=/home";
let reducedMotion = true;
const motionValueSets: jest.Mock[] = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
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
  createGitHubLoginUrl: (returnTo: string) => `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`,
  createGoogleLoginUrl: (returnTo: string) => `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
  loginWithEmail: jest.fn().mockResolvedValue({ ok: true, authenticated: true }),
  resendEmailSignupCode: jest.fn().mockResolvedValue({ ok: true, verificationRequired: true }),
  startEmailSignup: jest.fn().mockResolvedValue({ ok: true, verificationRequired: true }),
  verifyEmailSignupCode: jest.fn().mockResolvedValue({ ok: true, authenticated: true }),
  warmupBackend: jest.fn().mockResolvedValue(undefined),
}));

const mockedUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockedWarmupBackend = warmupBackend as jest.MockedFunction<typeof warmupBackend>;

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
    mockedUseAuthSession.mockReturnValue({
      status: "signed-out",
      session: null,
      error: null,
      refresh: jest.fn(),
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

    expect(result.container.querySelector("main")?.getAttribute("data-auth-page")).toBe("signup");
    expect(result.container.querySelector("header")).toBeNull();
    expect(
      Array.from(result.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Continue with GitHub"),
      ),
    ).not.toBeNull();
    expect(result.container.querySelector("a[href='/login']")).toHaveTextContent("Sign in");
    expect(result.container).toHaveTextContent("Secure workspace access");
    expect(result.container).toHaveTextContent("Source-backed YAML generation");
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

    const githubButton = Array.from(result.container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Continue with GitHub"),
    )!;
    expect(githubButton).toHaveTextContent("Continue with GitHub");

    const card = result.container.querySelector("main")?.lastElementChild?.firstElementChild as HTMLElement;
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
      card.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 75, clientY: 25 }));
      card.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      githubButton.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      githubButton.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      githubButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
    consoleErrorSpy.mockRestore();

    expect(mockedWarmupBackend).toHaveBeenCalledTimes(1);
  });

  it("redirects signed-in users to a safe next path fallback", () => {
    searchParamsValue = "next=https://example.com/phish";
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
      refresh: jest.fn(),
    });

    const result = renderSignup();
    root = result.root;

    expect(replaceMock).toHaveBeenCalledWith("/home");
  });

  it("keeps auth routes thin and feature-owned", () => {
    const loginRoute = fs.readFileSync(path.join(process.cwd(), "src/app/login/page.tsx"), "utf8");
    const signupRoute = fs.readFileSync(path.join(process.cwd(), "src/app/signup/page.tsx"), "utf8");
    const featureSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/auth/oauth-auth-page.tsx"), "utf8");

    expect(loginRoute).toContain("@/features/public-site/auth/oauth-auth-page");
    expect(signupRoute).toContain("@/features/public-site/auth/oauth-auth-page");
    expect(featureSource).toContain("oauth-auth-page.module.css");
    expect(featureSource).toContain("oauth-auth-card.module.css");
    expect(featureSource).not.toContain('className="auth-');
    expect(featureSource).not.toContain('className="hero-kicker"');
    expect(featureSource).not.toMatch(/[\u00e2\u00c2]/);
  });
});
