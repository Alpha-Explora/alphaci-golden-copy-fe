import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { FeatureStripSection } from "../../src/features/public-site/landing/feature-strip-section";

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
});
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

describe("FeatureStripSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders key feature cards without legacy feature-strip classes", () => {
    const result = render(<FeatureStripSection reduced />);
    root = result.root;

    expect(result.container.querySelector("section")?.getAttribute("aria-label")).toBe("Key features");
    expect(result.container.querySelector("[data-feature-strip-section='true']")).toBeInTheDocument();
    expect(result.container.querySelectorAll("[data-feature-card]")).toHaveLength(3);
    expect(result.container).toHaveTextContent("Source-backed generation");
    expect(result.container).toHaveTextContent("Guided setup to export");
    expect(result.container).toHaveTextContent("Release through governed lanes");
    expect(classList(result.container).some((name) => name.startsWith("feature-strip") || name === "features-strip" || name === "feature-card-enhanced" || name === "section-mesh")).toBe(false);
  });


  it("renders animated cards for standard motion mode", () => {
    const result = render(<FeatureStripSection reduced={false} />);
    root = result.root;

    expect(result.container.querySelectorAll("[data-feature-card]")).toHaveLength(3);
    expect(result.container.querySelector("[data-tone='accent']")).toBeInTheDocument();
    expect(result.container).toHaveTextContent("features/automation");
  });
  it("keeps feature-strip selectors out of globals after migration", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/feature-strip-section.tsx"), "utf8");

    expect(pageSource).toContain("FeatureStripSection");
    expect(sectionSource).toContain("feature-strip-section.module.css");
    expect(sectionSource).toContain("className={styles.section}");
    expect(sectionSource).toContain("className={styles.card}");
    expect(sectionSource).toContain("data-feature-strip-section");
    expect(globals).not.toContain(".features-strip");
    expect(globals).not.toContain(".feature-strip-item");
    expect(globals).not.toContain(".feature-card-enhanced");
    expect(globals).not.toContain(".feature-number");
    expect(globals).not.toContain(".section-mesh");
  });
});
