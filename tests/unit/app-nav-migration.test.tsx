import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { AppNav } from "../../src/components/layout/app-shell/app-nav";
import { getMyWorkspaces } from "../../src/lib/api/workspaces";

jest.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

jest.mock("../../src/lib/api/workspaces", () => ({
  getMyWorkspaces: jest.fn(),
}));

jest.mock("../../src/components/layout/workspace-context", () => ({
  useWorkspaceSelection: () => ({ setWorkspaces: jest.fn() }),
}));

const session = {
  authenticated: true,
  accessToken: "token",
  githubConnected: true,
  user: {
    id: "user-1",
    login: "builder",
    name: "Builder",
    avatarUrl: null,
    email: "builder@example.com",
    onboardingCompleted: true,
  },
  subscription: {
    plan: "pro",
    status: "active",
    provider: "paymongo",
    updatedAt: "2026-07-08T00:00:00.000Z",
    projectsUsed: 2,
    projectsLimit: 6,
  },
  platformRole: null,
};

const selectedProject = {
  id: "project-1",
  repoFullName: "builder/react-starter-kit",
  templateId: "next-app",
  serviceName: "react-starter-kit",
  workflowPath: ".github/workflows/ci.yml",
  status: "provisioned",
  githubCommitSha: null,
  githubCommitUrl: null,
  failureReason: null,
  repoUrl: null,
  visibility: "private",
  repoShape: "standalone",
  projectTypeId: "next",
  workflowRecipeId: "standard",
  projectOptions: null,
  isExample: false,
} as const;
const workspaces = {
  enabled: true,
  items: [
    {
      id: "workspace-1",
      name: "burritoneeeee",
      kind: "personal",
      role: "owner",
    },
  ],
};

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

function collectClasses(container: Element) {
  return Array.from(container.querySelectorAll("*"))
    .flatMap((element) => Array.from(element.classList));
}

describe("AppNav migration", () => {
  let root: Root | null = null;

  beforeEach(() => {
    (getMyWorkspaces as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("renders primary app navigation with the reusable Tailwind app header", () => {
    const result = render(
      <AppNav
        guest={false}
        session={session}
        onLogout={jest.fn()}
        isLoggingOut={false}
        workspaces={workspaces}
        projects={[selectedProject]}
        selectedProject={selectedProject}
      />,
    );
    root = result.root;

    const header = result.container.querySelector("header");
    expect(header?.getAttribute("data-app-header")).toBe("true");
    expect(header).toHaveTextContent("burritoneeeee");
    expect(header).toHaveTextContent("react-starter-kit");
    expect(header).not.toHaveTextContent("production");
    expect(header).not.toHaveTextContent("2/6");
    expect(header).toHaveTextContent("Search");
    expect(result.container.querySelector("button[aria-label='Open account menu']")).not.toBeNull();
    expect(result.container.querySelector("aside")?.getAttribute("data-app-nav")).toBe("true");
    expect(result.container.querySelector("nav a[href='/home']")?.getAttribute("aria-current")).toBe("page");
    expect(result.container.querySelector("a[href='/workflows']")).toHaveTextContent("Workflows");
    expect(result.container.querySelector("a[href='/runs']")).toHaveTextContent("Runs");
    expect(result.container.querySelector("a[href='/subscribe']")).toBeNull();
    expect(result.container.querySelector("a[href='/settings']")).toHaveTextContent("Settings");

    const classes = collectClasses(result.container);
    expect(classes).not.toContain("app-sidebar");
    expect(classes).not.toContain("primary-button");
    expect(classes.some((className) => className.startsWith("sidebar-"))).toBe(false);
  });

  it("does not render a project selector before any project exists", () => {
    const result = render(
      <AppNav
        guest={false}
        session={session}
        onLogout={jest.fn()}
        isLoggingOut={false}
        workspaces={{
          enabled: true,
          items: [{ id: "personal", name: "Personal workspace", kind: "personal", role: "owner" }],
        }}
        projects={[]}
        selectedProject={null}
      />,
    );
    root = result.root;

    const header = result.container.querySelector("header");
    expect(header).toHaveTextContent("Builder");
    expect(header).not.toHaveTextContent("Personal workspace");
    expect(header).not.toHaveTextContent("Select project");
    expect(result.container.querySelector("button[aria-label='Switch project']")).toBeNull();
  });

  it("can render the shared app header without the sidebar", () => {
    const result = render(
      <AppNav
        guest={false}
        session={session}
        onLogout={jest.fn()}
        isLoggingOut={false}
        workspaces={workspaces}
        projects={[selectedProject]}
        selectedProject={selectedProject}
        showSidebar={false}
      />,
    );
    root = result.root;

    expect(result.container.querySelector("header")?.getAttribute("data-app-header")).toBe("true");
    expect(result.container.querySelector("aside[data-app-nav='true']")).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--sidebar-width")).toBe("0px");
  });
  it("keeps the route import path as a compatibility export", () => {
    const compatibilitySource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-nav.tsx"), "utf8");
    const implementationSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-shell/app-nav.tsx"), "utf8");
    const headerSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-shell/app-header.tsx"), "utf8");
    const wrapperSource = fs.readFileSync(path.join(process.cwd(), "src/features/dashboard/app-shell/dashboard-app-nav.tsx"), "utf8");

    expect(compatibilitySource).toContain("@/features/dashboard/app-shell/dashboard-app-nav");
    expect(implementationSource).not.toContain("app-nav.module.css");
    expect(implementationSource).toContain("./app-header");
    expect(headerSource).toContain("@/components/ui/dropdown-menu");
    expect(headerSource).toContain("@/components/ui/avatar");
    expect(headerSource).not.toContain("app-header.module.css");
    expect(wrapperSource).toContain("useAppNavData");
    expect(implementationSource).not.toMatch(new RegExp("[\\u00e2\\u00c2]"));
    expect(headerSource).not.toMatch(new RegExp("[\\u00e2\\u00c2]"));
  });
});