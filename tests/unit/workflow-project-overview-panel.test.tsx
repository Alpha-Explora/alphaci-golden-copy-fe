import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WorkflowProjectOverviewPanel } from "../../src/components/product/workflow-project-overview-panel";
import type {
  ProjectDriftResponse,
  ProjectOverviewResponse,
  ProvisionedProject,
  WorkflowFileMetadata,
} from "../../src/lib/api/contracts";

const project: ProvisionedProject = {
  id: "project-1",
  repoFullName: "tone/orders-api",
  templateId: "nestjs-api",
  serviceName: "orders-api",
  workflowPath: ".github/workflows/00-alphaci.yml",
  workflowFiles: null,
  status: "provisioned",
  githubCommitSha: "abc1234567890",
  githubCommitUrl: "https://github.com/tone/orders-api/commit/abc1234567890",
  failureReason: null,
  projectOptions: {
    build: true,
    lint: true,
    unit: true,
  },
  repoUrl: "https://github.com/tone/orders-api",
};

const files: WorkflowFileMetadata[] = [
  {
    stage: "quality",
    name: "Quality",
    path: ".github/workflows/quality.yml",
    gated: true,
  },
  {
    stage: "package",
    name: "Package",
    path: ".github/workflows/package.yml",
    gated: true,
  },
];

const overview: ProjectOverviewResponse = {
  project: {
    ...project,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
  workflow: {
    path: ".github/workflows/alphaci.yml",
    files,
    stageCount: files.length,
    history: [],
  },
  deploymentTargets: {
    count: 2,
    items: [],
  },
  environment: {
    count: 0,
    failedCount: 0,
    items: [],
  },
  ciAuth: {
    status: "active",
    tokenPresent: true,
    tokenPrefix: "ghs",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    revokedAt: null,
  },
  health: {
    summary: "warning",
    checks: [
      {
        key: "ci-token",
        label: "CI token",
        status: "ok",
        message: "Token is active.",
      },
    ],
  },
  syncSnapshot: {
    enabled: true,
    mode: "local_snapshot",
    latest: {
      id: "snapshot-1",
      projectId: "project-1",
      status: "warning",
      summary: {},
      findings: [{ code: "target_missing", severity: "warning" }],
      startedAt: "2026-07-01T00:00:00.000Z",
      completedAt: "2026-07-01T00:01:00.000Z",
      createdBy: "AlphaCI",
      createdAt: "2026-07-01T00:01:00.000Z",
    },
  },
  capabilities: {
    envProvisioning: true,
    workflowSettings: true,
    syncSnapshots: true,
    ciRunTracking: true,
    deploymentHistory: true,
    driftDetection: true,
  },
};

const driftResponse: ProjectDriftResponse = {
  enabled: true,
  mode: "local_snapshot",
  findings: [],
};

function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return { container, root };
}

describe("WorkflowProjectOverviewPanel", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders project overview metadata, snapshot status, and health checks", () => {
    const rendered = render(
      <WorkflowProjectOverviewPanel
        driftDetectionEnabled={false}
        driftError={null}
        driftRepairEnabled={false}
        driftResponse={null}
        onProjectSync={jest.fn()}
        onRepairDriftFinding={jest.fn()}
        onRunDriftDetection={jest.fn()}
        project={project}
        runningDriftCheck={false}
        selectedOverview={overview}
        selectedWorkflowFiles={files}
        syncAvailable
        syncMessage={null}
        syncingProjectId={null}
        syncSnapshot={overview.syncSnapshot}
        workflowUpdatePrEnabled={false}
      />,
    );
    root = rendered.root;

    expect(rendered.container.textContent).toContain(".github/workflows/alphaci.yml");
    expect(rendered.container.textContent).toContain("build, lint, unit");
    expect(rendered.container.textContent).toContain("abc1234567");
    expect(rendered.container.textContent).toContain("2 gated workflow stages");
    expect(rendered.container.textContent).toContain("active");
    expect(rendered.container.textContent).toContain("2");
    expect(rendered.container.textContent).toContain("Local snapshot");
    expect(rendered.container.textContent).toContain("warning - 1 finding");
    expect(rendered.container.textContent).toContain("Token is active.");
    expect(rendered.container.querySelector('[data-tour="sync-health"]')).not.toBeNull();
  });

  it("passes sync and drift actions through to parent-owned handlers", () => {
    const onProjectSync = jest.fn();
    const onRunDriftDetection = jest.fn();
    const rendered = render(
      <WorkflowProjectOverviewPanel
        driftDetectionEnabled
        driftError={null}
        driftRepairEnabled={false}
        driftResponse={driftResponse}
        onProjectSync={onProjectSync}
        onRepairDriftFinding={jest.fn()}
        onRunDriftDetection={onRunDriftDetection}
        project={project}
        runningDriftCheck={false}
        selectedOverview={overview}
        selectedWorkflowFiles={files}
        syncAvailable
        syncMessage={null}
        syncingProjectId={null}
        syncSnapshot={overview.syncSnapshot}
        workflowUpdatePrEnabled
      />,
    );
    root = rendered.root;

    act(() => {
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Sync now")
        ?.click();
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Run drift check")
        ?.click();
    });

    expect(onProjectSync).toHaveBeenCalledTimes(1);
    expect(onRunDriftDetection).toHaveBeenCalledTimes(1);
  });

  it("preserves the original busy sync button label and disabled state", () => {
    const rendered = render(
      <WorkflowProjectOverviewPanel
        driftDetectionEnabled={false}
        driftError={null}
        driftRepairEnabled={false}
        driftResponse={null}
        onProjectSync={jest.fn()}
        onRepairDriftFinding={jest.fn()}
        onRunDriftDetection={jest.fn()}
        project={project}
        runningDriftCheck={false}
        selectedOverview={overview}
        selectedWorkflowFiles={files}
        syncAvailable
        syncMessage={null}
        syncingProjectId={project.id}
        syncSnapshot={overview.syncSnapshot}
        workflowUpdatePrEnabled={false}
      />,
    );
    root = rendered.root;

    const syncButton = Array.from(rendered.container.querySelectorAll("button"))
      .find((button) => button.textContent === "Syncing…");

    expect(syncButton).toBeDefined();
    expect(syncButton?.disabled).toBe(true);
  });
});
