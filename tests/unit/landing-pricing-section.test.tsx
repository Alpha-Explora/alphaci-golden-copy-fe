import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { LandingPricingSection } from "../../src/features/public-site/landing/landing-pricing-section";

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

function collectClasses(container: Element) {
  return Array.from(container.querySelectorAll("*")).flatMap((element) => Array.from(element.classList));
}

describe("LandingPricingSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the homepage pricing CTA without legacy global pricing classes", () => {
    const result = render(<LandingPricingSection reduced />);
    root = result.root;

    expect(result.container.querySelector("section#pricing")?.getAttribute("aria-label")).toBe("Pricing plans");
    expect(result.container.querySelector("[data-landing-pricing-section='true']")).toBeInTheDocument();
    expect(result.container.querySelector("a[href='/subscribe']")).toHaveTextContent("View plans");
    expect(result.container.querySelector("a[href='/home']")).toHaveTextContent("Start Pro");
    expect(result.container).toHaveTextContent("Start free");
    expect(result.container).toHaveTextContent("PHP 300");
    expect(result.container.querySelectorAll("[data-pricing-feature-row='true']")).toHaveLength(7);

    const classes = collectClasses(result.container);
    expect(classes).not.toContain("pricing-section");
    expect(classes).not.toContain("pricing-split");
    expect(classes).not.toContain("pricing-split-card");
    expect(classes).not.toContain("pricing-feature-row");
    expect(classes).not.toContain("primary-button");
    expect(classes).not.toContain("ghost-button");
  });

  it("renders animated pricing state", () => {
    const result = render(<LandingPricingSection reduced={false} />);
    root = result.root;

    expect(result.container.querySelector("[data-landing-pricing-section='true']")).toHaveTextContent("Everything you need");
    expect(result.container.querySelector("[data-paused='true']")).not.toBeInTheDocument();
  });

  it("keeps homepage pricing ownership outside route and global CSS", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/landing-pricing-section.tsx"), "utf8");

    expect(pageSource).toContain("<LandingPricingSection");
    expect(pageSource).not.toContain("pricing-section");
    expect(pageSource).not.toContain("function LandingPricingSection");
    expect(sectionSource).toContain("landing-pricing-section.module.css");
    expect(globals).not.toContain(".pricing-section");
    expect(globals).not.toContain(".pricing");
    expect(globals).not.toContain(".price-band");
    expect(globals).not.toContain(".price-");
    expect(globals).not.toContain(".pricing-split");
    expect(globals).not.toContain(".pricing-feature-row");
    expect(globals).not.toContain(".section-glow-center");
  });
});