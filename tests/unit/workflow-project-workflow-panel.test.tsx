import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WorkflowProjectWorkflowPanel } from "../../src/components/product/workflow-project-workflow-panel";
import type {
  DeploymentTarget,
  WorkflowFileMetadata,
  WorkflowSettings,
  WorkflowSettingsPreviewResponse,
  WorkflowUpdatePullRequestResponse,
} from "../../src/lib/api/contracts";

const workflowSettings: WorkflowSettings = {
  projectId: "project-1",
  templateId: "nestjs-api",
  projectTypeId: "nestjs-api",
  workflowRecipeId: "standard",
  serviceName: "orders-api",
  servicePath: "apps/orders",
  nodeVersion: "22",
  packageManager: "npm",
  coverageThreshold: 80,
  centralWorkflowRef: "main",
  checks: {
    lint: true,
    unit: true,
    build: true,
    security: false,
  },
};

const files: WorkflowFileMetadata[] = [
  {
    stage: "quality",
    name: "Quality",
    path: ".github/workflows/quality.yml",
    gated: true,
  },
];

const target: DeploymentTarget = {
  id: "target-1",
  projectId: "project-1",
  slot: "backend",
  ownershipMode: "flowci_managed",
  provider: "render",
  providerConnectionId: null,
  providerProjectId: "render-orders-api",
  providerProjectName: "orders-api",
  repoFullName: "tone/orders-api",
  branchName: "main",
  rootDirectory: "apps/orders",
  buildCommand: "npm run build",
  startCommand: "npm start",
  environmentMap: {},
  status: "active",
};

const workflowPreview: WorkflowSettingsPreviewResponse = {
  settings: workflowSettings,
  workflowFiles: [{ ...files[0], yaml: "name: quality" }],
  diffSummary: [
    {
      path: ".github/workflows/quality.yml",
      status: "changed",
    },
  ],
  validationWarnings: [
    {
      field: "coverageThreshold",
      message: "Coverage threshold is lower than recommended.",
    },
  ],
};

const workflowUpdatePr: WorkflowUpdatePullRequestResponse = {
  projectId: "project-1",
  repoFullName: "tone/orders-api",
  branchName: "alphaci/update-workflow",
  workflowPath: ".github/workflows/quality.yml",
  workflowFiles: files,
  pullRequestNumber: 42,
  pullRequestUrl: "https://github.com/tone/orders-api/pull/42",
  status: "created",
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

describe("WorkflowProjectWorkflowPanel", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders workflow settings, target mappings, preview diff, and update PR link", () => {
    const rendered = render(
      <WorkflowProjectWorkflowPanel
        creatingWorkflowPr={false}
        deploymentTargets={[target]}
        onCreateWorkflowPr={jest.fn()}
        onWorkflowPreview={jest.fn()}
        previewingWorkflow={false}
        selectedWorkflowFiles={files}
        setWorkflowSettings={jest.fn()}
        workflowPreview={workflowPreview}
        workflowSettings={workflowSettings}
        workflowSettingsError={null}
        workflowSettingsPreviewEnabled
        workflowUpdatePr={workflowUpdatePr}
        workflowUpdatePrEnabled
        workflowUpdatePrError={null}
        workflowSettingsCapable
      />,
    );
    root = rendered.root;

    expect(rendered.container.textContent).toContain("Workflow settings");
    expect(rendered.container.textContent).toContain("Preview only");
    expect(rendered.container.textContent).toContain("Deploy target mappings");
    expect(rendered.container.textContent).toContain("orders-api / main");
    expect(rendered.container.textContent).toContain("Coverage threshold is lower than recommended.");
    expect(rendered.container.textContent).toContain(".github/workflows/quality.yml");
    expect(rendered.container.textContent).toContain("changed");
    expect(rendered.container.querySelector('a[href="https://github.com/tone/orders-api/pull/42"]')).not.toBeNull();
  });

  it("passes setting edits and preview/create actions through to parent-owned handlers", () => {
    const setWorkflowSettings = jest.fn();
    const onWorkflowPreview = jest.fn();
    const onCreateWorkflowPr = jest.fn();
    const rendered = render(
      <WorkflowProjectWorkflowPanel
        creatingWorkflowPr={false}
        deploymentTargets={[]}
        onCreateWorkflowPr={onCreateWorkflowPr}
        onWorkflowPreview={onWorkflowPreview}
        previewingWorkflow={false}
        selectedWorkflowFiles={files}
        setWorkflowSettings={setWorkflowSettings}
        workflowPreview={workflowPreview}
        workflowSettings={workflowSettings}
        workflowSettingsError={null}
        workflowSettingsPreviewEnabled
        workflowUpdatePr={null}
        workflowUpdatePrEnabled
        workflowUpdatePrError={null}
        workflowSettingsCapable
      />,
    );
    root = rendered.root;

    act(() => {
      rendered.container.querySelector<HTMLInputElement>('input[aria-label="Security"]')!.click();
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Preview")
        ?.click();
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Create update PR")
        ?.click();
    });

    expect(setWorkflowSettings).toHaveBeenCalledWith(expect.objectContaining({
      checks: expect.objectContaining({ security: true }),
    }));
    expect(onWorkflowPreview).toHaveBeenCalledTimes(1);
    expect(onCreateWorkflowPr).toHaveBeenCalledTimes(1);
  });

  it("preserves the original central workflow ref help copy", () => {
    const rendered = render(
      <WorkflowProjectWorkflowPanel
        creatingWorkflowPr={false}
        deploymentTargets={[]}
        onCreateWorkflowPr={jest.fn()}
        onWorkflowPreview={jest.fn()}
        previewingWorkflow={false}
        selectedWorkflowFiles={files}
        setWorkflowSettings={jest.fn()}
        workflowPreview={null}
        workflowSettings={workflowSettings}
        workflowSettingsError={null}
        workflowSettingsPreviewEnabled
        workflowUpdatePr={null}
        workflowUpdatePrEnabled={false}
        workflowUpdatePrError={null}
        workflowSettingsCapable
      />,
    );
    root = rendered.root;

    act(() => {
      rendered.container
        .querySelectorAll<HTMLButtonElement>('button[aria-label="More information"]')[2]
        .focus();
    });

    expect(rendered.container.textContent).toContain(
      "It supplies the reusable gated-stage logic — Access, Quality, Package — that every generated workflow calls into.",
    );
  });
});
