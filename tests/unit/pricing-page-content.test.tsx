import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PricingPage } from "../../src/features/public-site/pricing/pricing-page";

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

describe("PricingPage content migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the pricing content inside the shared pricing shell", () => {
    const result = render(<PricingPage />);
    root = result.root;

    expect(result.container.querySelector("main")?.getAttribute("data-pricing-page-shell")).toBe("true");
    expect(result.container.querySelector("#pricing-page-title")).toHaveTextContent("Credits for governed CI/CD automation.");
    expect(result.container.querySelector("a[href='/subscribe']")).toHaveTextContent("Start Pro");
    expect(result.container).toHaveTextContent("PHP 0");
    expect(result.container).toHaveTextContent("PHP 300");
    expect(result.container).toHaveTextContent("Coming soon");
    expect(result.container.querySelectorAll("section[aria-label='AlphaCI plans'] article")).toHaveLength(4);
    expect(result.container.querySelector("table")?.textContent).toContain("Workflow update PRs");
    expect(result.container).toHaveTextContent("Do subscription credits roll over?");
  });

  it("keeps pricing content ownership outside the route entry point", () => {
    const routeSource = fs.readFileSync(path.join(process.cwd(), "src/app/pricing/page.tsx"), "utf8");
    const pricingFeatureSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/pricing/pricing-page.tsx"), "utf8");
    const appPricingCssPath = path.join(process.cwd(), "src/app/pricing/pricing.module.css");

    expect(routeSource).toContain("@/features/public-site/pricing/pricing-page");
    expect(routeSource).toContain("<PricingPage />");
    expect(routeSource).not.toContain("const plans");
    expect(routeSource).not.toContain("comparisonRows");
    expect(routeSource).not.toContain("faqItems");
    expect(routeSource).not.toContain("CheckIcon");
    expect(routeSource).not.toContain("pricing.module.css");
    expect(fs.existsSync(appPricingCssPath)).toBe(false);
    expect(pricingFeatureSource).toContain("pricing-page.module.css");
    expect(pricingFeatureSource).toContain("pricing-details.module.css");
  });

  it("does not emit legacy global pricing classes", () => {
    const result = render(<PricingPage />);
    root = result.root;

    const classes = collectClasses(result.container);
    expect(classes).not.toContain("pricing-page-card");
    expect(classes).not.toContain("pricing-table");
    expect(classes).not.toContain("pricing-card");
    expect(classes).not.toContain("primary-button");
    expect(classes).not.toContain("ghost-button");
  });
});