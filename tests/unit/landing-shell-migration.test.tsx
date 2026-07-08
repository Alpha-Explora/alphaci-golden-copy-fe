import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { LandingShell } from "../../src/features/public-site/landing/landing-shell";

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
  return Array.from(container.querySelectorAll("*"))
    .flatMap((element) => Array.from(element.classList));
}

describe("LandingShell migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("owns the landing page shell without legacy global shell classes", () => {
    const result = render(
      <LandingShell active="features">
        <section aria-label="Main message">Hero</section>
      </LandingShell>,
    );
    root = result.root;

    const shell = result.container.querySelector("main");
    expect(shell?.getAttribute("data-landing-shell")).toBe("true");
    expect(shell?.className).toContain("min-h-dvh");
    expect(shell?.className).toContain("overflow-x-hidden");
    expect(result.container.querySelector("a[href='#main-content']")).toHaveTextContent("Skip to main content");
    expect(result.container.querySelector("#main-content")?.textContent).toContain("Hero");
    expect(result.container.querySelector("a[href='/pricing']")?.textContent).toContain("Pricing");
    expect(result.container.querySelector("main > [aria-hidden='true']")).toBeInTheDocument();
    expect(collectClasses(result.container)).not.toContain("landing-page-shell");
  });

  it("uses the default active public nav state", () => {
    const result = render(
      <LandingShell>
        <section>Default active state</section>
      </LandingShell>,
    );
    root = result.root;

    expect(result.container.querySelector("#main-content")?.textContent).toContain("Default active state");
    expect(result.container.querySelector("a[href='/pricing']")).toBeInTheDocument();
  });

  it("keeps the root route using the feature-owned landing shell", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const shellSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/landing-shell.tsx"), "utf8");

    expect(source).toContain("LandingShell");
    expect(shellSource).not.toContain("landing-shell.module.css");
    expect(shellSource).toContain("className=\"min-h-dvh overflow-x-hidden");
    expect(source).not.toContain('className="landing-page-shell"');
    expect(globals).not.toContain(".landing-page-shell");
  });
});
