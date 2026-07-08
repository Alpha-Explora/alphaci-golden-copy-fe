import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PricingPageShell } from "../../src/features/public-site/pricing/pricing-page-shell";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

describe("PricingPageShell migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the public pricing shell with nav, skip link, and content", () => {
    const result = render(
      <PricingPageShell>
        <section id="main-content">Pricing content</section>
      </PricingPageShell>,
    );
    root = result.root;

    expect(result.container.querySelector("main")?.getAttribute("data-pricing-page-shell")).toBe("true");
    expect(result.container.querySelector("a[href='#main-content']")).toHaveTextContent("Skip to main content");
    expect(result.container.querySelector("header")?.getAttribute("data-active-section")).toBe("pricing");
    expect(result.container.querySelector("#main-content")).toHaveTextContent("Pricing content");
  });

  it("keeps pricing shell ownership outside the route CSS module", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/pricing/page.tsx"), "utf8");
    const appPricingCssPath = path.join(process.cwd(), "src/app/pricing/pricing.module.css");
    const appPricingCss = fs.existsSync(appPricingCssPath) ? fs.readFileSync(appPricingCssPath, "utf8") : "";
    const shellSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/pricing/pricing-page-shell.tsx"), "utf8");

    expect(pageSource).toContain("@/features/public-site/pricing/pricing-page");
    expect(pageSource).not.toContain("<main className={styles.shell}");
    expect(appPricingCss).not.toContain(".shell");
    expect(shellSource).not.toContain("pricing-page-shell.module.css");
  });
});
