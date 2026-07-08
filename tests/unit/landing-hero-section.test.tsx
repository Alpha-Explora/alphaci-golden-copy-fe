import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { motionValue } from "framer-motion";

import { HeroSection } from "../../src/features/public-site/landing/hero-section";

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

describe("HeroSection migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the approved public hero without legacy global classes", () => {
    const progress = motionValue(0);
    const result = render(
      <HeroSection
        reduced={true}
        primaryHref="/signup"
        primaryLabel="Get Started"
        pageScrollYProgress={progress}
      />,
    );
    root = result.root;

    expect(result.container.querySelector("[data-landing-hero-section='true']")).toBeInTheDocument();
    expect(result.container.querySelector("section")?.getAttribute("aria-label")).toBe("Main message");
    expect(result.container.querySelector("a[href='/signup']")).toHaveTextContent("Get Started");
    expect(result.container.querySelector("a[href='mailto:sales@alphaci.dev']")).toHaveTextContent("Contact Sales");
    expect(result.container).toHaveTextContent("Ship governed");
    expect(result.container).toHaveTextContent("Pipeline stages");
    expect(result.container).toHaveTextContent("All checks passed - 2m 14s");

    const classes = collectClasses(result.container);
    expect(classes).not.toContain("raw-hero-grid");
    expect(classes).not.toContain("raw-hero-content");
    expect(classes).not.toContain("raw-hero-actions");
    expect(classes).not.toContain("raw-hero-visual");
    expect(classes).not.toContain("primary-button");
    expect(classes).not.toContain("ghost-button");
  });


  it("covers animated hero state without legacy classes", () => {
    const progress = motionValue(0.25);
    const result = render(
      <HeroSection
        reduced={false}
        primaryHref="/home"
        primaryLabel="Open your workspace"
        pageScrollYProgress={progress}
      />,
    );
    root = result.root;

    expect(result.container.querySelector("a[href='/home']")).toHaveTextContent("Open your workspace");
    expect(result.container.querySelector("[data-landing-hero-section='true']")).toHaveTextContent("Live");
    expect(result.container.querySelector("[data-paused='true']")).toBeInTheDocument();
    expect(collectClasses(result.container)).not.toContain("primary-button");
  });
  it("keeps hero ownership outside route and global CSS", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const heroSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/hero-section.tsx"), "utf8");

    expect(pageSource).toContain("<HeroSection");
    expect(heroSource).not.toContain("hero-section.module.css");
    expect(heroSource).not.toContain("hero-visual.module.css");
    expect(pageSource).not.toContain("raw-hero-grid");
    expect(pageSource).not.toContain("function HeroSection");
    expect(globals).not.toContain(".raw-hero-grid");
    expect(globals).not.toContain(".landing-hero");
    expect(globals).not.toContain(".hero-system-kicker");
    expect(globals).not.toContain(".hero-proof-strip");
  });
});
