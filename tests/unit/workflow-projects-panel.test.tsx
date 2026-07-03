import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  WorkflowProjectList,
  WorkflowProjectsEmptyState,
  WorkflowProjectsLoadingState,
} from "../../src/components/product/workflow-projects-panel";
import type { ProvisionedProject } from "../../src/lib/api/contracts";

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react");
  const motion = new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
          const domProps = { ...props };
          for (const key of ["initial", "whileInView", "viewport", "transition"]) {
            delete domProps[key];
          }
          return React.createElement("div", domProps, children);
        },
    },
  );

  return {
    motion,
    useReducedMotion: () => false,
  };
});

const provisionedProject: ProvisionedProject = {
  id: "project-1",
  repoFullName: "tone/orders-api",
  templateId: "nestjs-api",
  serviceName: "orders-api",
  workflowPath: ".github/workflows/00-alphaci.yml",
  status: "provisioned",
  githubCommitSha: "abc123",
  githubCommitUrl: null,
  failureReason: null,
};

const failedDemoProject: ProvisionedProject = {
  ...provisionedProject,
  id: "project-2",
  repoFullName: "tone/demo-api",
  serviceName: "demo-api",
  status: "failed",
  isExample: true,
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

describe("workflow projects panel pieces", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("preserves the projects loading and empty states", () => {
    const onOpenSetup = jest.fn();
    const loading = render(<WorkflowProjectsLoadingState />);
    root = loading.root;

    expect(loading.container.querySelectorAll(".skeleton-card")).toHaveLength(3);

    act(() => root?.unmount());
    loading.container.remove();
    root = null;

    const empty = render(<WorkflowProjectsEmptyState onOpenSetup={onOpenSetup} />);
    root = empty.root;

    expect(empty.container.textContent).toContain("No provisioned projects yet.");
    expect(empty.container.textContent).toContain("Create your first project");
    expect(empty.container.querySelector(".inline-link")?.getAttribute("href")).toBe("/guide");

    act(() => {
      Array.from(empty.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Create your first project")
        ?.click();
    });

    expect(onOpenSetup).toHaveBeenCalledTimes(1);
  });

  it("preserves project selection, status badges, and new-project action", () => {
    const onOpenSetup = jest.fn();
    const onProjectSelected = jest.fn();
    const rendered = render(
      <WorkflowProjectList
        onOpenSetup={onOpenSetup}
        onProjectSelected={onProjectSelected}
        projects={[provisionedProject, failedDemoProject]}
        selectedProject={failedDemoProject}
      />,
    );
    root = rendered.root;

    expect(rendered.container.querySelector(".project-list")).not.toBeNull();
    expect(rendered.container.textContent).toContain("Projects");
    expect(rendered.container.textContent).toContain("orders-api");
    expect(rendered.container.textContent).toContain("demo-api");
    expect(rendered.container.textContent).toContain("Demo");
    expect(rendered.container.querySelector<HTMLButtonElement>('button[data-project-id="project-2"]')?.getAttribute("aria-pressed")).toBe("true");

    act(() => {
      Array.from(rendered.container.querySelectorAll("button"))
        .find((button) => button.textContent === "New")
        ?.click();
      rendered.container.querySelector<HTMLButtonElement>('button[data-project-id="project-1"]')?.click();
    });

    expect(onOpenSetup).toHaveBeenCalledTimes(1);
    expect(onProjectSelected).toHaveBeenCalledWith("project-1");
  });
});
