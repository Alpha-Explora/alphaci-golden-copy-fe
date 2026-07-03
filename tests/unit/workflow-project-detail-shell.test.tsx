import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  PROJECT_DETAIL_TABS,
  WorkflowProjectDetailActions,
  WorkflowProjectDetailHeader,
  WorkflowProjectDetailTabs,
  type ProjectDetailTab,
} from "../../src/components/product/workflow-project-detail-shell";
import type { ProvisionedProject } from "../../src/lib/api/contracts";

const provisionedProject: ProvisionedProject = {
  id: "project-1",
  repoFullName: "tone/orders-api",
  templateId: "nestjs-api",
  serviceName: "orders-api",
  workflowPath: ".github/workflows/00-alphaci.yml",
  status: "provisioned",
  githubCommitSha: "abc123",
  githubCommitUrl: "https://github.com/tone/orders-api/commit/abc123",
  failureReason: null,
  repoUrl: "https://github.com/tone/orders-api",
};

const demoProject: ProvisionedProject = {
  ...provisionedProject,
  id: "project-demo",
  isExample: true,
  repoUrl: null,
  githubCommitUrl: null,
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

describe("workflow project detail shell", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("preserves project header and demo note rendering", () => {
    const rendered = render(<WorkflowProjectDetailHeader project={demoProject} />);
    root = rendered.root;

    expect(rendered.container.textContent).toContain("tone/orders-api");
    expect(rendered.container.textContent).toContain("orders-api");
    expect(rendered.container.textContent).toContain("Demo · read-only");
    expect(rendered.container.textContent).toContain("read-only demo project");
    expect(rendered.container.querySelector(".inline-link")?.getAttribute("href")).toBe("/guide#branch-strategy");
  });

  it("preserves project actions and environment shortcut visibility", () => {
    const onEnvironmentSelected = jest.fn();
    const rendered = render(
      <WorkflowProjectDetailActions
        envProvisioningEnabled
        onEnvironmentSelected={onEnvironmentSelected}
        project={provisionedProject}
      />,
    );
    root = rendered.root;

    expect(rendered.container.querySelector('a[href="https://github.com/tone/orders-api"]')).not.toBeNull();
    expect(rendered.container.querySelector('a[href="https://github.com/tone/orders-api/actions"]')).not.toBeNull();
    expect(rendered.container.querySelector('a[href="https://github.com/tone/orders-api/commit/abc123"]')).not.toBeNull();

    act(() => {
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Environment Variables")
        ?.click();
    });

    expect(onEnvironmentSelected).toHaveBeenCalledTimes(1);

    act(() => root?.unmount());
    rendered.container.remove();
    root = null;

    const hidden = render(
      <WorkflowProjectDetailActions
        envProvisioningEnabled
        onEnvironmentSelected={jest.fn()}
        project={demoProject}
      />,
    );
    root = hidden.root;

    expect(hidden.container.textContent).not.toContain("Environment Variables");
  });

  it("preserves tab ids, active state, and tab change callback", () => {
    const onTabSelected = jest.fn();
    const rendered = render(
      <WorkflowProjectDetailTabs
        activeTab="workflow"
        onTabSelected={onTabSelected}
        tabs={PROJECT_DETAIL_TABS}
      />,
    );
    root = rendered.root;

    const workflowTab = rendered.container.querySelector<HTMLButtonElement>('button[aria-selected="true"]');
    expect(workflowTab?.textContent).toBe("Workflow");

    act(() => {
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Environment")
        ?.click();
    });

    expect(onTabSelected).toHaveBeenCalledWith("environment" satisfies ProjectDetailTab);
  });
});
