import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useWorkflowProjectOverview } from "../../src/components/product/use-workflow-project-overview";
import { useWorkflowProjectTelemetry } from "../../src/components/product/use-workflow-project-telemetry";
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
  getProjectAuditEvents: jest.fn(),
  getProjectCiRuns: jest.fn(),
  getProjectDeployments: jest.fn(),
  getProjectDrift: jest.fn(),
  getProjectOverview: jest.fn(),
  getWorkflowSettings: jest.fn(),
  previewWorkflowSettings: jest.fn(),
  repairProjectDriftFinding: jest.fn(),
  runProjectDriftDetection: jest.fn(),
  syncProjectSnapshot: jest.fn(),
}));

const mockedProjectApi = jest.requireMock("../../src/lib/api/projects") as {
  createWorkflowUpdatePullRequest: jest.Mock;
  getProjectAuditEvents: jest.Mock;
  getProjectCiRuns: jest.Mock;
  getProjectDeployments: jest.Mock;
  getProjectDrift: jest.Mock;
  getProjectOverview: jest.Mock;
  getWorkflowSettings: jest.Mock;
  previewWorkflowSettings: jest.Mock;
  repairProjectDriftFinding: jest.Mock;
  runProjectDriftDetection: jest.Mock;
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

function ciRunsResponseFor(workflowName: string) {
  return {
    enabled: true,
    githubActionsUrl: "https://github.test/actions",
    liveGithubEnabled: false,
    mode: "local_mock" as const,
    runs: [{
      actor: "octocat",
      branch: "main",
      canRerun: false,
      commitSha: "abc123",
      conclusion: null,
      createdAt: "2026-07-03T00:00:00.000Z",
      htmlUrl: "https://github.test/actions/runs/1",
      id: `run-${workflowName}`,
      stage: "build" as const,
      status: "queued" as const,
      updatedAt: "2026-07-03T00:00:00.000Z",
      workflowName,
    }],
  };
}

function driftResponseFor(projectId: string) {
  return {
    enabled: true,
    findings: [{
      code: "target_missing",
      detectedAt: "2026-07-03T00:00:00.000Z",
      details: {},
      id: `finding-${projectId}`,
      message: "Target missing",
      projectId,
      resolvedAt: null,
      severity: "warning" as const,
      source: "local_snapshot" as const,
      status: "active" as const,
      targetId: null,
    }],
    mode: "local_snapshot" as const,
  };
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

  it("loads project telemetry by active detail tab and capability gates", async () => {
    let current: ReturnType<typeof useWorkflowProjectTelemetry> | null = null;
    const selectedOverview = overviewFor(projectA);
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe({ tab }: Readonly<{ tab: "runs" | "deployments" | "audit" }>) {
      const value = useWorkflowProjectTelemetry({
        ciRunTrackingEnabled: true,
        deploymentHistoryEnabled: true,
        driftDetectionEnabled: true,
        projectDetailTab: tab,
        selectedOverview,
        selectedProject: projectA,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectCiRuns.mockResolvedValueOnce({
      enabled: true,
      githubActionsUrl: "https://github.test/actions",
      liveGithubEnabled: false,
      mode: "local_mock",
      runs: [],
    });
    mockedProjectApi.getProjectDeployments.mockResolvedValueOnce({
      deployments: [],
      enabled: true,
      liveProvidersEnabled: false,
      mode: "local_mock",
    });
    mockedProjectApi.getProjectAuditEvents.mockResolvedValueOnce({
      enabled: true,
      items: [{ actorUserId: null, createdAt: "2026-07-03T00:00:00.000Z", eventCode: "project_synced", id: "audit-1", message: "Synced" }],
    });

    await act(async () => {
      root?.render(<Probe tab="runs" />);
      await flushPromises();
    });

    expect(mockedProjectApi.getProjectCiRuns).toHaveBeenCalledWith("project-a");
    expect(current?.ciRunsResponse?.enabled).toBe(true);

    await act(async () => {
      root?.render(<Probe tab="deployments" />);
      await flushPromises();
    });

    expect(mockedProjectApi.getProjectDeployments).toHaveBeenCalledWith("project-a");
    expect(current?.deploymentsResponse?.enabled).toBe(true);

    await act(async () => {
      root?.render(<Probe tab="audit" />);
      await flushPromises();
    });

    expect(mockedProjectApi.getProjectAuditEvents).toHaveBeenCalledWith("project-a");
    expect(current?.auditResponse?.items[0]?.eventCode).toBe("project_synced");
  });

  it("does not return telemetry loaded for a previous selected project", async () => {
    let current: ReturnType<typeof useWorkflowProjectTelemetry> | null = null;
    const renderedTelemetry: Array<{ projectId: string; workflowName: string | null }> = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe({ selectedProject }: Readonly<{ selectedProject: ProvisionedProject }>) {
      const value = useWorkflowProjectTelemetry({
        ciRunTrackingEnabled: true,
        deploymentHistoryEnabled: true,
        driftDetectionEnabled: true,
        projectDetailTab: "runs",
        selectedOverview: overviewFor(selectedProject),
        selectedProject,
      });
      renderedTelemetry.push({
        projectId: selectedProject.id,
        workflowName: value.ciRunsResponse?.runs[0]?.workflowName ?? null,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectCiRuns
      .mockResolvedValueOnce(ciRunsResponseFor("project-a-run"))
      .mockResolvedValue(ciRunsResponseFor("project-b-run"));

    await act(async () => {
      root?.render(<Probe selectedProject={projectA} />);
      await flushPromises();
    });

    expect(current?.ciRunsResponse?.runs[0]?.workflowName).toBe("project-a-run");

    await act(async () => {
      root?.render(<Probe selectedProject={projectB} />);
    });

    const projectBRenders = renderedTelemetry.filter((entry) => entry.projectId === "project-b");
    expect(projectBRenders.some((entry) => entry.workflowName === "project-a-run")).toBe(false);
  });

  it("runs and repairs drift checks through the telemetry hook", async () => {
    let current: ReturnType<typeof useWorkflowProjectTelemetry> | null = null;
    const selectedOverview = overviewFor(projectA);
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe() {
      const value = useWorkflowProjectTelemetry({
        ciRunTrackingEnabled: true,
        deploymentHistoryEnabled: true,
        driftDetectionEnabled: true,
        projectDetailTab: "overview",
        selectedOverview,
        selectedProject: projectA,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectDrift.mockResolvedValueOnce({
      enabled: true,
      findings: [],
      mode: "local_snapshot",
    });

    await act(async () => {
      root?.render(<Probe />);
      await flushPromises();
    });

    expect(mockedProjectApi.getProjectDrift).toHaveBeenCalledWith("project-a");

    mockedProjectApi.runProjectDriftDetection.mockResolvedValueOnce({
      enabled: true,
      findings: [{
        code: "target_missing",
        detectedAt: "2026-07-03T00:00:00.000Z",
        details: {},
        id: "finding-1",
        message: "Target missing",
        projectId: "project-a",
        resolvedAt: null,
        severity: "warning",
        source: "local_snapshot",
        status: "active",
        targetId: null,
      }],
      mode: "local_snapshot",
    });

    await act(async () => {
      await current?.handleRunDriftDetection();
    });

    expect(mockedProjectApi.runProjectDriftDetection).toHaveBeenCalledWith("project-a");
    expect(current?.driftResponse?.findings).toHaveLength(1);

    mockedProjectApi.repairProjectDriftFinding.mockResolvedValueOnce({
      action: "mark_ignored",
      enabled: true,
      findingId: "finding-1",
      message: "Marked ignored",
      mode: "local_safe",
      status: "completed",
    });

    await expect(current?.handleRepairDriftFinding("finding-1", "mark_ignored")).resolves.toBe("Marked ignored");
    expect(mockedProjectApi.repairProjectDriftFinding).toHaveBeenCalledWith("project-a", "finding-1", "mark_ignored");
  });

  it("ignores drift run results that resolve after the selected project changes", async () => {
    let current: ReturnType<typeof useWorkflowProjectTelemetry> | null = null;
    const renderedDrift: Array<{ projectId: string; findingProjectId: string | null }> = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    function Probe({ selectedProject }: Readonly<{ selectedProject: ProvisionedProject }>) {
      const value = useWorkflowProjectTelemetry({
        ciRunTrackingEnabled: true,
        deploymentHistoryEnabled: true,
        driftDetectionEnabled: true,
        projectDetailTab: "overview",
        selectedOverview: overviewFor(selectedProject),
        selectedProject,
      });
      renderedDrift.push({
        findingProjectId: value.driftResponse?.findings[0]?.projectId ?? null,
        projectId: selectedProject.id,
      });
      useEffect(() => {
        current = value;
      }, [value]);
      return null;
    }

    mockedProjectApi.getProjectDrift
      .mockResolvedValueOnce({
        enabled: true,
        findings: [],
        mode: "local_snapshot",
      })
      .mockResolvedValue({
        enabled: true,
        findings: [],
        mode: "local_snapshot",
      });

    let resolveDriftRun: (value: ReturnType<typeof driftResponseFor>) => void = () => {};
    mockedProjectApi.runProjectDriftDetection.mockReturnValueOnce(new Promise((resolve) => {
      resolveDriftRun = resolve;
    }));

    await act(async () => {
      root?.render(<Probe selectedProject={projectA} />);
      await flushPromises();
    });

    let runForProjectA: Promise<void> | undefined;
    await act(async () => {
      runForProjectA = current?.handleRunDriftDetection();
    });

    await act(async () => {
      root?.render(<Probe selectedProject={projectB} />);
      await flushPromises();
    });

    await act(async () => {
      resolveDriftRun(driftResponseFor("project-a"));
      await runForProjectA;
      await flushPromises();
    });

    const projectBRenders = renderedDrift.filter((entry) => entry.projectId === "project-b");
    expect(projectBRenders.some((entry) => entry.findingProjectId === "project-a")).toBe(false);
  });
});
