import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WorkflowCurrentSubtabBar } from "../../src/components/product/workflow-current-navigation";
import { WorkflowLatestResultBanner } from "../../src/components/product/workflow-current-result-banner";
import type { CreateProjectResult } from "../../src/lib/api/contracts";

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react");
  return {
    motion: {
      span: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
        const domProps = { ...props };
        delete domProps.layoutId;
        delete domProps.transition;
        return React.createElement("span", domProps, children);
      },
    },
  };
});

describe("workflow current result banner", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders latest project result links, chips, workflow metadata, and stages", () => {
    const result: CreateProjectResult = {
      id: "project-1",
      repoFullName: "acme/orders-api",
      repoUrl: "https://github.com/acme/orders-api",
      status: "provisioned",
      workflowPath: ".github/workflows/quality.yml",
      workflowFiles: [
        {
          stage: "quality",
          name: "quality",
          path: ".github/workflows/quality.yml",
          gated: true,
        },
      ],
      outputFileName: "quality.yml",
      githubCommitSha: "abc123456789",
      githubCommitUrl: "https://github.com/acme/orders-api/commit/abc123456789",
      projectTypeId: "backend",
      workflowRecipeId: "node-api",
      branchesCreated: ["main", "uat", "test"],
    };

    act(() => {
      root.render(<WorkflowLatestResultBanner result={result} />);
    });

    expect(container.textContent).toContain("Project Created Successfully");
    expect(container.textContent).toContain("acme/orders-api");
    expect(container.textContent).toContain("quality.yml");
    expect(container.textContent).toContain("abc1234567");
    expect(container.textContent).toContain("1 gated workflow stages");
    expect(container.textContent).toContain("main");
    expect(container.textContent).toContain("uat");
    expect(container.textContent).toContain("test");
    expect(container.querySelector('a[href="https://github.com/acme/orders-api"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://github.com/acme/orders-api/actions"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://github.com/acme/orders-api/blob/main/.github/workflows/quality.yml"]')).not.toBeNull();
  });

  it("renders and changes the current subtab while preserving counters", () => {
    const onSubTabChange = jest.fn();

    act(() => {
      root.render(
        <WorkflowCurrentSubtabBar
          historyCount={2}
          loadingHistory={false}
          loadingProjects={false}
          projectsCount={3}
          subTab="projects"
          onSubTabChange={onSubTabChange}
        />,
      );
    });

    expect(container.textContent).toContain("Projects");
    expect(container.textContent).toContain("History");
    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");

    const historyTab = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("History"),
    ) as HTMLButtonElement;
    act(() => {
      historyTab.click();
    });

    expect(onSubTabChange).toHaveBeenCalledWith("history");
  });
});
