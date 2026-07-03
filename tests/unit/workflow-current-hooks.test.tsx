import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useWorkflowProjectOverview } from "../../src/components/product/use-workflow-project-overview";
import { useWorkflowSettingsPreview } from "../../src/components/product/use-workflow-settings-preview";
import type {
  DeploymentTarget,
  ProjectOverviewResponse,
  ProvisionedProject,
  WorkflowSettings,
  WorkflowSettingsPreviewResponse,
} from "../../src/lib/api/contracts";

jest.mock("../../src/lib/api/projects", () => ({
  createWorkflowUpdatePullRequest: jest.fn(),
  getProjectOverview: jest.fn(),
  getWorkflowSettings: jest.fn(),
  previewWorkflowSettings: jest.fn(),
  syncProjectSnapshot: jest.fn(),
}));

const mockedProjectApi = jest.requireMock("../../src/lib/api/projects") as {
  createWorkflowUpdatePullRequest: jest.Mock;
  getProjectOverview: jest.Mock;
  getWorkflowSettings: jest.Mock;
  previewWorkflowSettings: jest.Mock;
  syncProjectSnapshot: jest.Mock;
};

const projectA: ProvisionedProject = {
  failureReason: null,
  githubCommitSha: "abc123",
  githubCommitUrl: null,
  id: "project-a",
  repoFullName: "tone/api",
  serviceName: "api",
  status: "provisioned",
  templateId: "nestjs-api",
  workflowPath: ".github/workflows/main.yml",
};

const projectB: ProvisionedProject = {
  ...projectA,
  id: "project-b",
  repoFullName: "tone/web",
  serviceName: "web",
};

const targetA: DeploymentTarget = {
  branchName: "main",
  buildCommand: "npm run build",
  environmentMap: {},
  id: "target-a",
  ownershipMode: "flowci_managed",
  projectId: "project-a",
  provider: "render",
  providerConnectionId: null,
  providerMetadata: {},
  providerProjectId: "srv-a",
  providerProjectName: "api",
  renderEnvironmentName: "test",
  repoFullName: "tone/api",
  rootDirectory: ".",
  slot: "backend",
  startCommand: "npm start",
  status: "active",
};

const workflowSettings: WorkflowSettings = {
  centralWorkflowRef: "main",
  checks: {
    build: true,
    lint: true,
    security: true,
    unit: true,
  },
  coverageThreshold: 80,
  nodeVersion: "20",
  packageManager: "npm",
  projectId: "project-a",
  projectTypeId: "nestjs-api",
  serviceName: "api",
  servicePath: ".",
  templateId: "nestjs-api",
  workflowRecipeId: "standard",
};

function overviewFor(project: ProvisionedProject, targets: DeploymentTarget[] = []): ProjectOverviewResponse {
  return {
    capabilities: {
      ciRunTracking: true,
      deploymentHistory: true,
      driftDetection: true,
      envProvisioning: true,
      syncSnapshots: true,
      workflowSettings: true,
    },
    ciAuth: {
      createdAt: null,
      revokedAt: null,
      status: "active",
      tokenPrefix: null,
      tokenPresent: true,
      updatedAt: null,
    },
    deploymentTargets: {
      count: targets.length,
      items: targets,
    },
    environment: {
      count: 0,
      failedCount: 0,
      items: [],
    },
    health: {
      checks: [],
      summary: "ok",
    },
    project: {
      ...project,
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T00:00:00.000Z",
    },
    syncSnapshot: {
      enabled: true,
      latest: null,
      mode: "local_snapshot",
    },
    workflow: {
      files: [],
      history: [],
      path: project.workflowPath,
      stageCount: 0,
    },
  };
}

function previewFor(settings: WorkflowSettings): WorkflowSettingsPreviewResponse {
  return {
    diffSummary: [{ path: ".github/workflows/main.yml", status: "changed" }],
    settings,
    validationWarnings: [],
    workflowFiles: [],
  };
}

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("workflow current extracted hooks", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("loads overview for selected project changes and syncs snapshots", async () => {
    let current: ReturnType<typeof useWorkflowProjectOverview> | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe({ selectedProjectId }: Readonly<{ selectedProjectId: string | null }>) {
      const value = useWorkflowProjectOverview({
        projectSyncSnapshotsEnabled: true,
        projects: [projectA, projectB],
        selectedProjectId,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectOverview
      .mockResolvedValueOnce(overviewFor(projectA, [targetA]))
      .mockResolvedValueOnce(overviewFor(projectB));

    await act(async () => {
      root?.render(<Probe selectedProjectId={null} />);
      await flushPromises();
    });

    expect(current?.selectedProject?.id).toBe("project-a");
    expect(current?.selectedOverview?.project.id).toBe("project-a");

    await act(async () => {
      root?.render(<Probe selectedProjectId="project-b" />);
      await flushPromises();
    });

    expect(current?.selectedProject?.id).toBe("project-b");
    expect(current?.selectedOverview?.project.id).toBe("project-b");

    const syncedOverview = overviewFor(projectB, [{ ...targetA, id: "target-b", projectId: "project-b" }]);
    mockedProjectApi.syncProjectSnapshot.mockResolvedValueOnce({
      overview: syncedOverview,
      snapshot: syncedOverview.syncSnapshot.latest,
    });

    await act(async () => {
      await current?.handleProjectSync();
    });

    expect(mockedProjectApi.syncProjectSnapshot).toHaveBeenCalledWith("project-b");
    expect(current?.selectedOverview?.deploymentTargets.count).toBe(1);
    expect(current?.syncMessage).toBeNull();
  });

  it("keeps sync errors local to the overview hook", async () => {
    let current: ReturnType<typeof useWorkflowProjectOverview> | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe() {
      const value = useWorkflowProjectOverview({
        projectSyncSnapshotsEnabled: true,
        projects: [projectA],
        selectedProjectId: null,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectOverview.mockResolvedValueOnce(overviewFor(projectA));

    await act(async () => {
      root?.render(<Probe />);
      await flushPromises();
    });

    mockedProjectApi.syncProjectSnapshot.mockRejectedValueOnce(new Error("failed"));

    await act(async () => {
      await current?.handleProjectSync();
    });

    expect(current?.syncMessage).toBe("Unable to create local snapshot right now.");
  });

  it("gates workflow PR creation on preview and resets stale PRs after re-preview", async () => {
    let current: ReturnType<typeof useWorkflowSettingsPreview> | null = null;
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe() {
      const value = useWorkflowSettingsPreview({
        selectedProject: projectA,
        workflowSettingsPreviewEnabled: true,
        workflowTabActive: true,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getWorkflowSettings.mockResolvedValueOnce({
      enabled: true,
      settings: workflowSettings,
      source: "stored",
    });

    await act(async () => {
      root?.render(<Probe />);
      await flushPromises();
    });

    await act(async () => {
      await current?.handleCreateWorkflowPr();
    });

    expect(mockedProjectApi.createWorkflowUpdatePullRequest).not.toHaveBeenCalled();

    mockedProjectApi.previewWorkflowSettings.mockResolvedValueOnce(previewFor(workflowSettings));

    await act(async () => {
      await current?.handleWorkflowPreview();
    });

    mockedProjectApi.createWorkflowUpdatePullRequest.mockResolvedValueOnce({
      branchName: "alphaci/update-workflow",
      projectId: "project-a",
      pullRequestNumber: 12,
      pullRequestUrl: "https://github.test/pr/12",
      repoFullName: "tone/api",
      status: "created",
      workflowFiles: [],
      workflowPath: ".github/workflows/main.yml",
    });

    await act(async () => {
      await current?.handleCreateWorkflowPr();
    });

    expect(mockedProjectApi.createWorkflowUpdatePullRequest).toHaveBeenCalledWith("project-a", workflowSettings);
    expect(current?.workflowUpdatePr?.pullRequestNumber).toBe(12);

    const updatedSettings = { ...workflowSettings, nodeVersion: "22" };
    mockedProjectApi.previewWorkflowSettings.mockResolvedValueOnce(previewFor(updatedSettings));

    await act(async () => {
      current?.setWorkflowSettings(updatedSettings);
    });
    await act(async () => {
      await current?.handleWorkflowPreview();
    });

    expect(current?.workflowPreview?.settings.nodeVersion).toBe("22");
    expect(current?.workflowUpdatePr).toBeNull();
  });
});
