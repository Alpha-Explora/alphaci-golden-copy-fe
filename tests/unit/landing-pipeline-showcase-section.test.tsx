import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PipelineShowcaseSection } from "../../src/features/public-site/landing/pipeline-showcase-section";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

function classList(container: Element) {
  return Array.from(container.querySelectorAll("*"))
    .flatMap((element) => Array.from(element.classList));
}

describe("PipelineShowcaseSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the pipeline showcase without landing legacy classes", () => {
    const result = render(<PipelineShowcaseSection reduced />);
    root = result.root;

    expect(result.container.querySelector("[data-pipeline-showcase-section='true']")).toBeInTheDocument();
    expect(result.container).toHaveTextContent("Generated workflow");
    expect(result.container).toHaveTextContent("pipeline/generated-workflow.yml");
    expect(result.container).toHaveTextContent("From push to deploy in minutes");
    expect(result.container).toHaveTextContent("pipeline/payments-service.yml");
    expect(result.container).toHaveTextContent("workflow/generated-output.yml");
    expect(result.container).toHaveTextContent("payments-service-ci");
    expect(result.container.querySelectorAll("[data-pipeline-stage]")).toHaveLength(6);
    expect(result.container.querySelectorAll("[data-terminal-window]")).toHaveLength(2);
    expect(classList(result.container).some((name) => ["pipeline-section", "pipeline-node", "pipeline-connector-line", "pipeline-stage-label", "file-path-label", "hero-mockup", "mockup-keyword", "mockup-string", "mockup-comment", "mockup-key"].includes(name))).toBe(false);
  });

  it("moves landing pipeline selectors and implementation out of globals and the route", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/pipeline-showcase-section.tsx"), "utf8");
    const sectionStyles = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/pipeline-showcase-section.module.css"), "utf8");

    expect(pageSource).toContain("PipelineShowcaseSection");
    expect(pageSource).not.toContain("function PipelineVisualization");
    expect(pageSource).not.toContain("function HeroYamlTerminal");
    expect(sectionSource).toContain("pipeline-showcase-section.module.css");
    expect(sectionSource).toContain("className={styles.section}");
    expect(sectionStyles).toContain("@keyframes pipelineNodeSuccess");
    expect(sectionStyles).toContain("@keyframes pipelineCursorPulse");
    expect(sectionStyles).toContain("@keyframes pipelineStatusPulse");
    expect(sectionStyles).toContain(".statusPassing::before");
    expect(sectionStyles).toContain("box-shadow: var(--shadow-elevated), var(--glow-brand)");
    expect(sectionStyles).toMatch(/\.stagePanel\s*\{[\s\S]*border-radius: 0\.75rem;/);
    expect(sectionStyles).not.toContain("radius-md");
    expect(sectionStyles).not.toContain("flowPulse");
    expect(globals).not.toContain(".pipeline-section");
    expect(globals).not.toContain(".pipeline-node");
    expect(globals).not.toContain(".pipeline-connector-line");
    expect(globals).not.toContain(".pipeline-stage-label");
  });
});