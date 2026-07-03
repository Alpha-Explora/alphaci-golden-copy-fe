import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { AppNav } from "../../src/components/layout/app-nav";
import { getNotifications } from "../../src/lib/api/notifications";
import { getMyWorkspaces } from "../../src/lib/api/workspaces";

jest.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

jest.mock("../../src/lib/api/workspaces", () => ({
  getMyWorkspaces: jest.fn(),
}));

jest.mock("../../src/lib/api/notifications", () => ({
  getNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
}));

jest.mock("../../src/components/layout/workspace-context", () => ({
  useWorkspaceSelection: () => ({ setWorkspaces: jest.fn() }),
}));

const session = {
  authenticated: true,
  accessToken: "token",
  githubConnected: true,
  user: {
    id: 1,
    login: "builder",
    name: "Builder",
    avatarUrl: null,
    onboardingCompleted: true,
  },
  subscription: {
    plan: "pro",
    status: "active",
    projectsUsed: 1,
    projectsLimit: 10,
    usageUsed: 0,
    usageLimit: 100,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  },
  platformRole: null,
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
    (getNotifications as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("renders primary app navigation without legacy sidebar globals", () => {
    const result = render(
      <AppNav
        guest={false}
        session={session}
        onLogout={jest.fn()}
        isLoggingOut={false}
      />,
    );
    root = result.root;

    expect(result.container.querySelector("aside")?.getAttribute("data-app-nav")).toBe("true");
    expect(result.container.querySelector("nav a[href='/home']")?.getAttribute("aria-current")).toBe("page");
    expect(result.container.querySelector("a[href='/workflows']")).toHaveTextContent("Workflows");
    expect(result.container.querySelector("a[href='/runs']")).toHaveTextContent("Runs");
    expect(result.container.querySelector("a[href='/subscribe']")).toHaveTextContent("Billing");
    expect(result.container.querySelector("a[href='/settings']")).toHaveTextContent("Settings");

    const classes = collectClasses(result.container);
    expect(classes).not.toContain("app-sidebar");
    expect(classes).not.toContain("primary-button");
    expect(classes.some((className) => className.startsWith("sidebar-"))).toBe(false);
  });

  it("keeps the route import path as a compatibility export", () => {
    const compatibilitySource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-nav.tsx"), "utf8");
    const implementationSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-shell/app-nav.tsx"), "utf8");

    expect(compatibilitySource).toContain("@/components/layout/app-shell/app-nav");
    expect(implementationSource).toContain("app-nav.module.css");
    expect(implementationSource).not.toMatch(new RegExp("[\\u00e2\\u00c2]"));
  });
});


