import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { projectBorderClass, projectStatusChipClass } from "../../src/features/dashboard/home/home-repositories-panel";
import { useHomeDashboardData } from "../../src/features/dashboard/home/use-home-dashboard-data";
import { disconnectProject, getGithubRepos, getProjects, getWorkflowHistory, syncProjects } from "../../src/lib/api/client";

jest.mock("../../src/lib/api/client", () => ({
  disconnectProject: jest.fn(),
  getGithubRepos: jest.fn(),
  getProjects: jest.fn(),
  getWorkflowHistory: jest.fn(),
  syncProjects: jest.fn(),
}));

let latest: ReturnType<typeof useHomeDashboardData> | null = null;

function HookHarness({
  selectedWorkspaceId,
  status,
  onSnapshot,
}: {
  selectedWorkspaceId: string | null;
  status: "loading" | "signed-out" | "signed-in" | "error";
  onSnapshot: (snapshot: ReturnType<typeof useHomeDashboardData>) => void;
}) {
  const snapshot = useHomeDashboardData({ status, selectedWorkspaceId });
  useEffect(() => {
    onSnapshot(snapshot);
  }, [onSnapshot, snapshot]);
  return null;
}

function render(status: "loading" | "signed-out" | "signed-in" | "error" = "signed-in") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <HookHarness
        selectedWorkspaceId="ws-1"
        status={status}
        onSnapshot={(snapshot) => {
          latest = snapshot;
        }}
      />,
    );
  });
  return { root };
}

describe("useHomeDashboardData", () => {
  let root: Root | null = null;

  beforeEach(() => {
    latest = null;
    (getWorkflowHistory as jest.Mock).mockResolvedValue({
      items: [{ id: "h-1", serviceName: "payments", stack: "Node", outputFileName: "workflow.yml", createdAt: "2026-07-01T00:00:00.000Z" }],
    });
    (getProjects as jest.Mock).mockResolvedValue({
      items: [{ id: "p-1", repoFullName: "acme/payments", serviceName: "payments", status: "provisioned", workflowPath: ".github/workflows/ci.yml" }],
    });
    (getGithubRepos as jest.Mock).mockResolvedValue({
      repos: [
        { id: "r-1", fullName: "acme/payments", htmlUrl: "https://github.com/acme/payments", private: false, description: "Billing service" },
        { id: "r-2", fullName: "acme/admin", htmlUrl: "https://github.com/acme/admin", private: true, description: "Back office" },
      ],
    });
    (syncProjects as jest.Mock).mockResolvedValue({ orphaned: 0, reachable: 1, total: 1 });
    (disconnectProject as jest.Mock).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("loads dashboard data for signed-in users", async () => {
    ({ root } = render());

    await act(async () => {
      await Promise.resolve();
    });

    expect(getWorkflowHistory).toHaveBeenCalledWith(25);
    expect(getProjects).toHaveBeenCalledWith(25, { workspaceId: "ws-1" });
    expect(getGithubRepos).toHaveBeenCalledTimes(1);
    expect(latest?.history[0]?.serviceName).toBe("payments");
    expect(latest?.projects[0]?.repoFullName).toBe("acme/payments");
    expect(latest?.repos).toHaveLength(2);
    expect(latest?.uniqueServices).toBe(1);
  });

  it("does not load data while signed out", () => {
    ({ root } = render("signed-out"));

    expect(getWorkflowHistory).not.toHaveBeenCalled();
    expect(getProjects).not.toHaveBeenCalled();
    expect(getGithubRepos).not.toHaveBeenCalled();
  });

  it("filters repositories by query text", async () => {
    ({ root } = render());
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      latest?.setRepoQuery("admin");
    });

    expect(latest?.filteredRepos).toHaveLength(1);
    expect(latest?.filteredRepos[0]?.fullName).toBe("acme/admin");
  });

  it("disconnects a provisioned project from local state", async () => {
    ({ root } = render());
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await latest?.handleDisconnect("p-1");
    });

    expect(disconnectProject).toHaveBeenCalledWith("p-1");
    expect(latest?.projects).toHaveLength(0);
  });

  it("maps project status classes", () => {
    expect(projectBorderClass("provisioned")).toBe("repo-card-success");
    expect(projectBorderClass("failed")).toBe("repo-card-danger");
    expect(projectStatusChipClass("orphaned")).toBe("status-chip status-chip-amber");
  });
});
