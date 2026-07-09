import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { getGithubAppInstallUrl, linkGithubInstallation } from "../../src/lib/api/client";
import { createProject } from "../../src/lib/api/projects";
import { OnboardingPage } from "../../src/features/dashboard/onboarding/onboarding-page";

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockUseAuthSession = jest.fn();

jest.mock("../../src/lib/api/client", () => ({
  getGithubAppInstallUrl: jest.fn(),
  linkGithubInstallation: jest.fn(),
}));

jest.mock("../../src/lib/api/projects", () => ({
  createProject: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

jest.mock("../../src/hooks/use-auth-session", () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock("../../src/components/layout/app-nav", () => ({
  AppNav: ({ showSidebar = true }: { showSidebar?: boolean }) => (
    <>
      <header data-app-header="true">App nav header</header>
      {showSidebar ? <aside data-app-nav="true">App nav sidebar</aside> : null}
    </>
  ),
}));

function signedInAuthSession({ githubConnected = false }: { githubConnected?: boolean } = {}) {
  return {
    refresh: jest.fn(),
    status: "signed-in",
    session: {
      authenticated: true,
      accessToken: "token",
      githubConnected,
      user: {
        id: "user-1",
        login: "antoneeeems",
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
  };
}

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
    await Promise.resolve();
  });
}

describe("OnboardingPage", () => {
  const githubInstallUrl = "https://github.com/apps/alphaci/installations/new";
  const originalRepositoryImportFlag = process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED;
  const mockedGetGithubAppInstallUrl = jest.mocked(getGithubAppInstallUrl);
  const mockedLinkGithubInstallation = jest.mocked(linkGithubInstallation);
  const mockedCreateProject = jest.mocked(createProject);
  let root: Root | null = null;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED;
    window.history.replaceState(null, "", "/onboarding");
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    mockUseAuthSession.mockReturnValue(signedInAuthSession());
    mockedGetGithubAppInstallUrl.mockResolvedValue({ installUrl: githubInstallUrl });
    mockedLinkGithubInstallation.mockResolvedValue({ reposLinked: 19, repositorySelection: "all" });
    mockedCreateProject.mockResolvedValue({
      id: "project-1",
      repoFullName: "antoneeeems/react",
      repoUrl: "https://github.com/antoneeeems/react",
      status: "provisioned",
      workflowPath: ".github/workflows/ci.yml",
      workflowFiles: [],
      githubCommitSha: "commit-sha",
      githubCommitUrl: null,
      projectTypeId: "react-spa",
      workflowRecipeId: "frontend-release",
    });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    mockedGetGithubAppInstallUrl.mockReset();
    mockedLinkGithubInstallation.mockReset();
    mockedCreateProject.mockReset();
    mockUseAuthSession.mockReset();
    jest.restoreAllMocks();
    if (originalRepositoryImportFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED = originalRepositoryImportFlag;
    }
  });

  it("opens GitHub App installation without marking GitHub authorized immediately", async () => {
    const result = render(<OnboardingPage />);
    root = result.root;

    expect(result.container.querySelector("[data-app-header='true']")).not.toBeNull();
    expect(result.container.querySelector("[data-app-nav='true']")).toBeNull();
    expect(result.container.querySelector("[data-onboarding-page='true']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Ship your first application");
    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='connect-github']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 2 of 4 - Connect your source control provider");
    expect(result.container).not.toHaveTextContent("Step 2 of 4 - Authorize GitHub access");
    expect(result.container).not.toHaveTextContent("Step 3 of 4 - Select a repository");

    await flushAsyncEffects();
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    click(result.container.querySelector("button[data-action='connect-github']"));
    expect(openSpy).toHaveBeenCalledWith(
      githubInstallUrl,
      "alphaci-github-install",
      expect.stringContaining("popup=yes,width=560,height=720"),
    );
    expect(openSpy.mock.calls[0]?.[2]).not.toEqual(expect.stringContaining("noopener"));
    expect(openSpy.mock.calls[0]?.[2]).not.toEqual(expect.stringContaining("noreferrer"));

    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='connect-github']")).not.toBeNull();
    expect(result.container).not.toHaveTextContent("Step 2 of 4 - Authorize GitHub access");
    expect(result.container).not.toHaveTextContent("Authorized as");
    expect(mockedLinkGithubInstallation).not.toHaveBeenCalled();
  });

  it("starts at repository selection when GitHub is already connected", async () => {
    mockUseAuthSession.mockReturnValue(signedInAuthSession({ githubConnected: true }));

    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='select-repository']")).not.toBeNull();
    expect(result.container.querySelector("[data-onboarding-step='connect-github']")).toBeNull();
    expect(result.container).toHaveTextContent("Step 3 of 4 - Select a repository");
    expect(result.container).toHaveTextContent("Use a template");
    expect(result.container.querySelectorAll("button[data-template]")).toHaveLength(4);
    expect(result.container.querySelector("button[data-template='react-starter-kit']")).not.toBeNull();
    expect(result.container.querySelector("button[data-template='nextjs-starter-kit']")).not.toBeNull();
    expect(result.container.querySelector("button[data-template='nodejs-starter-kit']")).not.toBeNull();
    expect(result.container.querySelector("button[data-template='nestjs-starter-kit']")).not.toBeNull();
    expect(result.container.querySelector("button[data-template='react-starter-kit']")?.className).toContain("hover:border-cyan-400/50");
    expect(result.container.querySelector("button[data-template='react-starter-kit']")?.className).toContain("hover:bg-cyan-400/10");
    expect(result.container.querySelector("button[data-template='nextjs-starter-kit']")?.className).toContain("hover:border-neutral-400/50");
    expect(result.container.querySelector("button[data-template='nextjs-starter-kit']")?.className).toContain("hover:bg-neutral-400/10");
    expect(result.container.querySelector("button[data-template='nodejs-starter-kit']")?.className).toContain("hover:border-emerald-400/50");
    expect(result.container.querySelector("button[data-template='nodejs-starter-kit']")?.className).toContain("hover:bg-emerald-400/10");
    expect(result.container.querySelector("button[data-template='nestjs-starter-kit']")?.className).toContain("hover:border-rose-400/50");
    expect(result.container.querySelector("button[data-template='nestjs-starter-kit']")?.className).toContain("hover:bg-rose-400/10");
    expect(result.container.querySelector("[data-template-icon='react']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nextjs']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nodejs']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nestjs']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='react'] [data-template-logo='react']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nextjs'] [data-template-logo='nextjs']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nodejs'] [data-template-logo='nodejs']")).not.toBeNull();
    expect(result.container.querySelector("[data-template-icon='nestjs'] [data-template-logo='nestjs']")).not.toBeNull();
    for (const icon of result.container.querySelectorAll("[data-template-icon]")) {
      expect(icon.className).not.toContain("border");
    }
    expect(result.container).not.toHaveTextContent("JSNode.js Starter Kit");
    expect(result.container).toHaveTextContent("React Starter Kit");
    expect(result.container).toHaveTextContent("React, TypeScript, shadcn/ui");
    expect(result.container).toHaveTextContent("Next.js Starter Kit");
    expect(result.container).toHaveTextContent("Next.js, TypeScript, App Router");
    expect(result.container).toHaveTextContent("Node.js Starter Kit");
    expect(result.container).toHaveTextContent("Node.js, TypeScript, API service");
    expect(result.container).toHaveTextContent("NestJS Starter Kit");
    expect(result.container).toHaveTextContent("NestJS, TypeScript, REST API");
    expect(result.container).not.toHaveTextContent("Laravel");
    expect(result.container).not.toHaveTextContent("Vue Starter Kit");
    expect(result.container).not.toHaveTextContent("Livewire Starter Kit");
    expect(result.container).not.toHaveTextContent("Svelte Starter Kit");
    expect(result.container).not.toHaveTextContent("Import a repository");
    expect(result.container).not.toHaveTextContent("Search all repositories");
    expect(result.container).not.toHaveTextContent("repositories fetched");
    expect(mockedLinkGithubInstallation).not.toHaveBeenCalled();
  });

  it("keeps repository import behind an onboarding feature flag", async () => {
    process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED = "true";
    mockUseAuthSession.mockReturnValue(signedInAuthSession({ githubConnected: true }));

    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    expect(result.container.querySelector("[data-onboarding-step='select-repository']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Import a repository");
    expect(result.container.querySelector("input[placeholder='Search all repositories']")).not.toBeNull();
    expect(result.container).toHaveTextContent("repositories fetched");
    expect(result.container.querySelector("button[data-repository='eve-slack-agent']")).not.toBeNull();

    click(result.container.querySelector("button[data-template-tab='use-template']"));

    expect(result.container).toHaveTextContent("React Starter Kit");
    expect(result.container).toHaveTextContent("Next.js Starter Kit");
    expect(result.container).toHaveTextContent("Node.js Starter Kit");
    expect(result.container).toHaveTextContent("NestJS Starter Kit");
    expect(result.container.querySelector("button[data-starter-kit='react-starter-kit']")).not.toBeNull();
    expect(result.container.querySelector("input[placeholder='Search all repositories']")).toBeNull();
    expect(result.container).not.toHaveTextContent("Choose your plan");
  });
  it("preserves the GitHub App callback while redirecting signed-out users", async () => {
    mockUseAuthSession.mockReturnValue({
      refresh: jest.fn(),
      status: "signed-out",
      session: null,
    });
    window.history.replaceState(null, "", "/onboarding?installation_id=12345&setup_action=install");

    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/signup?next=%2Fonboarding%3Finstallation_id%3D12345%26setup_action%3Dinstall",
    );
    expect(window.location.search).toBe("?installation_id=12345&setup_action=install");
    expect(result.container).toHaveTextContent("Redirecting to sign up");
    expect(result.container).not.toHaveTextContent("Authorized as");
    expect(mockedLinkGithubInstallation).not.toHaveBeenCalled();
  });

  it("links the GitHub App installation and moves to repository selection from the callback URL", async () => {
    window.history.replaceState(null, "", "/onboarding?installation_id=12345");
    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    expect(window.location.search).toBe("");
    expect(mockedLinkGithubInstallation).toHaveBeenCalledWith(12345);
    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='select-repository']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 3 of 4 - Select a repository");
    expect(result.container).not.toHaveTextContent("Step 4 of 4 - Create your application");

    expect(result.container).toHaveTextContent("Use a template");
    expect(result.container).not.toHaveTextContent("Import a repository");
    expect(result.container).not.toHaveTextContent("Search all repositories");

    click(result.container.querySelector("button[data-template='react-starter-kit']"));

    expect(result.container.querySelectorAll("[data-onboarding-step]")).toHaveLength(1);
    expect(result.container.querySelector("[data-onboarding-step='create-application']")).not.toBeNull();
    expect(result.container).toHaveTextContent("Step 4 of 4 - Create your application");
    expect(result.container).toHaveTextContent("react-starter-kit");

    const applicationNameInput = result.container.querySelector<HTMLInputElement>("input[data-field='application-name']");
    expect(applicationNameInput).not.toBeNull();
    expect(applicationNameInput?.value).toBe("react-starter-kit");
    expect(result.container.querySelector("input[data-field='repository-name']")).toBeNull();
    expect(result.container).toHaveTextContent("Your template name is react-starter-kit.");

    click(result.container.querySelector("button[data-action='change-repository-name']"));

    const repositoryNameInput = result.container.querySelector<HTMLInputElement>("input[data-field='repository-name']");
    expect(repositoryNameInput).not.toBeNull();
    expect(repositoryNameInput).not.toBe(applicationNameInput);
    expect(repositoryNameInput?.value).toBe("react-starter-kit");
    expect(result.container).toHaveTextContent("Repository name");
    expect(applicationNameInput?.value).toBe("react-starter-kit");

    click(result.container.querySelector("button[data-action='create-application']"));
    await flushAsyncEffects();

    expect(mockedCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "starter-kit",
        starterKitId: "react-starter-kit",
        repoName: "react",
        visibility: "private",
        repoShape: "single-app",
        projectTypeId: "react-spa",
        workflowRecipeId: "frontend-release",
        serviceName: "react",
        servicePath: ".",
      }),
    );
    expect(JSON.stringify(mockedCreateProject.mock.calls[0]?.[0])).not.toContain('"plan"');
    expect(result.container).toHaveTextContent("Project created");
  });

  it("notifies the opener and closes when the GitHub App callback lands in a popup", async () => {
    jest.useFakeTimers();
    const postMessage = jest.fn();
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => undefined);
    Object.defineProperty(window, "opener", {
      value: { postMessage },
      configurable: true,
    });
    window.history.replaceState(null, "", "/onboarding?installation_id=12345&setup_action=install");

    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    expect(mockedLinkGithubInstallation).toHaveBeenCalledWith(12345);
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

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("accepts a GitHub App callback message from a localhost popup", async () => {
    const result = render(<OnboardingPage />);
    root = result.root;

    await flushAsyncEffects();

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        origin: "http://127.0.0.1",
        data: {
          type: "alphaci:github-installation",
          installationId: 67890,
          setupAction: "install",
        },
      }));
    });
    await flushAsyncEffects();

    expect(mockedLinkGithubInstallation).toHaveBeenCalledWith(67890);
    expect(result.container.querySelector("[data-onboarding-step='select-repository']")).not.toBeNull();
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
