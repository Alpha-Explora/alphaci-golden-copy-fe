import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ReleaseLanesSection } from "../../src/features/public-site/landing/release-lanes-section";

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

describe("ReleaseLanesSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders release lane content without legacy deploy classes", () => {
    const result = render(<ReleaseLanesSection reduced />);
    root = result.root;

    expect(result.container.querySelector("[data-release-lanes-section='true']")).toBeInTheDocument();
    expect(result.container).toHaveTextContent("Release lanes");
    expect(result.container).toHaveTextContent("release/lanes.yml");
    expect(result.container).toHaveTextContent("Production lane");
    expect(result.container).toHaveTextContent("Review lane");
    expect(result.container.querySelectorAll("[data-release-lane-card]")).toHaveLength(2);
    expect(result.container.querySelectorAll("[data-release-step]")).toHaveLength(4);
    expect(classList(result.container).some((name) => name.startsWith("deploy-") || name === "file-path-label")).toBe(false);
  });

  it("moves release lane implementation and selectors out of the route/global file", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/release-lanes-section.tsx"), "utf8");
    const sectionStyles = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/release-lanes-section.module.css"), "utf8");

    expect(pageSource).toContain("ReleaseLanesSection");
    expect(pageSource).not.toContain("function ReleaseLanesSection");
    expect(sectionSource).toContain("release-lanes-section.module.css");
    expect(sectionSource).toContain("className={styles.section}");
    expect(sectionStyles).toContain(".section::before");
    expect(sectionStyles).toContain(".path::before");
    expect(sectionStyles).toContain("@keyframes releaseLanePulse");
    expect(sectionStyles).not.toContain("flowPulse");
    expect(globals).not.toContain(".deploy-section");
    expect(globals).not.toContain(".deploy-provider");
    expect(globals).not.toContain(".deploy-step");
  });
});