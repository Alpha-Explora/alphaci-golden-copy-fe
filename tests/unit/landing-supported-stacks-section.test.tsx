import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SupportedStacksSection } from "../../src/features/public-site/landing/supported-stacks-section";

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

describe("SupportedStacksSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the doubled stack track without legacy marquee classes", () => {
    const result = render(<SupportedStacksSection />);
    root = result.root;

    expect(result.container.querySelector("section")?.getAttribute("aria-label")).toBe("Supported Ecosystems");
    expect(result.container).toHaveTextContent("Supported stacks");
    expect(result.container.querySelectorAll("[data-stack-badge]")).toHaveLength(24);
    expect(result.container.querySelectorAll("[data-stack-name='Next.js']")).toHaveLength(2);
    expect(result.container.querySelectorAll("[data-stack-badge][aria-hidden='true']")).toHaveLength(12);
    expect(classList(result.container).some((name) => name.startsWith("marquee-"))).toBe(false);
  });

  it("keeps marquee selectors out of globals after migration", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/supported-stacks-section.tsx"), "utf8");

    expect(pageSource).toContain("SupportedStacksSection");
    expect(sectionSource).not.toContain("supported-stacks-section.module.css");
    expect(sectionSource).toContain("useReducedMotion");
    expect(sectionSource).toContain("animate={prefersReducedMotion ? undefined");
    expect(sectionSource).toContain("data-stack-badge");
    expect(globals).not.toContain('section[aria-label="Supported Ecosystems"]');
    expect(globals).not.toContain(".marquee-");
    expect(globals).not.toContain("@keyframes marquee-scroll");
  });
});
