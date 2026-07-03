import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WorkflowHistoryPanel } from "../../src/components/product/workflow-history-panel";
import type { WorkflowHistoryItem } from "../../src/lib/api/contracts";

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react");
  const motion = new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => {
          const domProps = { ...props };
          for (const key of ["initial", "animate", "transition", "whileHover", "variants"]) {
            delete domProps[key];
          }
          return React.createElement("div", domProps, children);
        },
    },
  );

  return { motion };
});

const historyItem: WorkflowHistoryItem = {
  id: "history-1",
  createdAt: "2026-07-01T00:00:00.000Z",
  templateId: "nextjs",
  templateName: "Next.js CI",
  stack: "Next.js",
  serviceName: "web-app",
  outputFileName: "alphaci.yml",
  sourceWorkflowFile: "workflow-templates/nextjs.yml",
  sourcePropertiesFile: "workflow-templates/nextjs.properties",
  lineCount: 42,
  yaml: "name: AlphaCI\non: push",
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

describe("WorkflowHistoryPanel", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("preserves generated workflow card actions and YAML preview", () => {
    const onCopyYaml = jest.fn();
    const onDownloadYaml = jest.fn();
    const onOpenSetup = jest.fn();

    const rendered = render(
      <WorkflowHistoryPanel
        history={[historyItem]}
        loadingHistory={false}
        onCopyYaml={onCopyYaml}
        onDownloadYaml={onDownloadYaml}
        onOpenSetup={onOpenSetup}
      />,
    );
    root = rendered.root;

    expect(rendered.container.textContent).toContain("Next.js CI");
    expect(rendered.container.textContent).toContain("web-app");
    expect(rendered.container.textContent).toContain("workflow-templates/nextjs.yml");
    expect(rendered.container.textContent).toContain("Preview YAML config");

    act(() => {
      Array.from(rendered.container.querySelectorAll("button")).find((button) => button.textContent === "Copy YAML")?.click();
      Array.from(rendered.container.querySelectorAll("button")).find((button) => button.textContent === "Download")?.click();
      Array.from(rendered.container.querySelectorAll("button")).find((button) => button.textContent === "New")?.click();
    });

    expect(onCopyYaml).toHaveBeenCalledWith(historyItem.yaml);
    expect(onDownloadYaml).toHaveBeenCalledWith(historyItem.yaml, historyItem.outputFileName);
    expect(onOpenSetup).toHaveBeenCalledTimes(1);
  });

  it("preserves loading and empty states", () => {
    const onOpenSetup = jest.fn();
    const loading = render(
      <WorkflowHistoryPanel
        history={[]}
        loadingHistory
        onCopyYaml={jest.fn()}
        onDownloadYaml={jest.fn()}
        onOpenSetup={onOpenSetup}
      />,
    );
    root = loading.root;

    expect(loading.container.querySelectorAll(".skeleton-card")).toHaveLength(3);

    act(() => root?.unmount());
    loading.container.remove();
    root = null;

    const empty = render(
      <WorkflowHistoryPanel
        history={[]}
        loadingHistory={false}
        onCopyYaml={jest.fn()}
        onDownloadYaml={jest.fn()}
        onOpenSetup={onOpenSetup}
      />,
    );
    root = empty.root;

    expect(empty.container.textContent).toContain("No generated workflow history yet.");

    act(() => {
      Array.from(empty.container.querySelectorAll("button"))
        .find((button) => button.textContent === "Generate your first workflow")
        ?.click();
    });

    expect(onOpenSetup).toHaveBeenCalledTimes(1);
  });
});
