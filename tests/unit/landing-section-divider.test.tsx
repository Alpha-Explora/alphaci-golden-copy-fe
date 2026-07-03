import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { LandingSectionDivider } from "../../src/features/public-site/landing/landing-section-divider";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

describe("LandingSectionDivider migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders an animated visual divider without legacy divider classes", () => {
    const result = render(<LandingSectionDivider reduced />);
    root = result.root;

    const divider = result.container.querySelector("hr[data-landing-section-divider='true']");
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider?.className).not.toContain("section-gradient-divider");
  });

  it("keeps divider styling out of globals after migration", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const dividerSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/landing-section-divider.tsx"), "utf8");
    const dividerUsages = pageSource.match(/<LandingSectionDivider/g) ?? [];

    expect(pageSource).toContain("LandingSectionDivider");
    expect(dividerUsages).toHaveLength(3);
    expect(pageSource).not.toContain("section-gradient-divider");
    expect(dividerSource).toContain("landing-section-divider.module.css");
    expect(dividerSource).toContain("className={styles.divider}");
    expect(globals).not.toContain(".section-gradient-divider");
  });
});
