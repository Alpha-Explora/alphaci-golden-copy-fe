import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { getGithubAppInstallUrl } from "../../src/lib/api/client";
import { OnboardingPage } from "../../src/features/dashboard/onboarding/onboarding-page";

jest.mock("../../src/lib/api/client", () => ({
  getGithubAppInstallUrl: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("../../src/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    refresh: jest.fn(),
    status: "signed-in",
    session: {
      authenticated: true,
      accessToken: "token",
      githubConnected: true,
      user: {
        id: "user-1",
        login: "builder",
        name: "Builder",
        avatarUrl: null,
        email: "builder@example.com",
        onboardingCompleted: false,
      },
      subscription: {
        plan: "pro",
        status: "active",
        provider: "paymongo",
        updatedAt: "2026-07-08T00:00:00.000Z",
        projectsUsed: 0,
        projectsLimit: 6,
      },
      platformRole: null,
    },
  }),
}));

jest.mock("../../src/components/layout/app-nav", () => ({
  AppNav: ({ showSidebar = true }: { showSidebar?: boolean }) => (
    <>
      <header data-app-header="true">App nav header</header>
      {showSidebar ? <aside data-app-nav="true">App nav sidebar</aside> : null}
    </>
  ),
}));

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

function click(button: Element | null) {
  expect(button).not.toBeNull();
  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("OnboardingPage", () => {
  const githubInstallUrl = "https://github.com/apps/alphaci/installations/new";
  const mockedGetGithubAppInstallUrl = jest.mocked(getGithubAppInstallUrl);
  let root: Root | null = null;
  beforeEach(() => {
    mockedGetGithubAppInstallUrl.mockResolvedValue({ installUrl: githubInstallUrl });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    mockedGetGithubAppInstallUrl.mockReset();
    jest.restoreAllMocks();
  });

  it("renders inside the shared app shell and reveals onboarding steps sequentially", async () => {
    const result = render(<OnboardingPage />);
    root = result.root;

    expect(result.container.querySelector("[data-app-header='true']")).not.toBeNull();
    expect(result.container.querySelector("[data-app-nav='true']")).toBeNull();
    expect(result.container.querySelector("[data-onboarding-page='true']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Ship your first application");
    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='connect-github']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 2 of 4 - Connect your source control provider");
    expect(result.container).not.toHaveTextContent("Step 3 of 4 - Select a repository");
    expect(result.container).not.toHaveTextContent("Step 4 of 4 - Create your application");

    await flushAsyncEffects();
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    click(result.container.querySelector("button[data-action='connect-github']"));
    expect(openSpy).toHaveBeenCalledWith(
      githubInstallUrl,
      "alphaci-github-install",
      expect.stringContaining("popup=yes,width=560,height=720"),
    );
    expect(openSpy.mock.calls[0]?.[2]).toEqual(expect.stringContaining("noopener,noreferrer"));

    expect(result.container.querySelector("[data-github-auth-prompt='true']")).toBeNull();
    expect(result.container).not.toHaveTextContent("Install & Authorize AlphaCI App");
    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='authorize-github']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 2 of 4 - Authorize GitHub access");
    expect(result.container).not.toHaveTextContent("Step 3 of 4 - Select a repository");

    click(result.container.querySelector("button[data-action='finish-github-setup']"));

    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='select-repository']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 3 of 4 - Select a repository");
    expect(result.container).not.toHaveTextContent("Step 4 of 4 - Create your application");

    click(result.container.querySelector("button[data-repository='eve-slack-agent']"));

    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='create-application']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 4 of 4 - Create your application");
    expect(result.container).toHaveTextContent("eve-slack-agent");
  });

  it("keeps the route entry point thin and owns styles in the onboarding feature", () => {
    const routeSource = fs.readFileSync(path.join(process.cwd(), "src/app/onboarding/page.tsx"), "utf8");
    const featureSource = fs.readFileSync(
      path.join(process.cwd(), "src/features/dashboard/onboarding/onboarding-page.tsx"),
      "utf8",
    );

    expect(routeSource).toContain("@/features/dashboard/onboarding/onboarding-page");
    expect(routeSource).toContain("<OnboardingPage />");
    expect(routeSource).not.toContain("repositories");
    expect(routeSource).not.toContain("onboarding-page.module.css");
    expect(featureSource).not.toContain("onboarding-page.module.css");
    expect(featureSource).not.toContain("data-github-auth-prompt");
    expect(featureSource).toContain("@/components/layout/app-nav");
    expect(featureSource).toContain("DashboardShell");
    expect(featureSource).not.toContain("function TopBar");
    expect(featureSource).not.toContain("function Footer");
    expect(featureSource).not.toContain("Crafted for governed releases");
  });
});
