import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PublicSiteNav } from "../../src/components/layout/public-site-nav";

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

describe("PublicSiteNav migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders the public shell without legacy global public-site classes", () => {
    const result = render(<PublicSiteNav active="pricing" fixed />);
    root = result.root;

    expect(result.container.querySelector("header")?.getAttribute("data-active-section")).toBe("pricing");
    expect(result.container.querySelector("nav")?.textContent).toContain("Pricing");
    expect(result.container.querySelector("a[href='/login']")?.textContent).toContain("Sign In");
    expect(result.container.querySelector("a[href='/signup']")?.textContent).toContain("Sign Up");
    expect(collectClasses(result.container).some((className) => className.startsWith("public-site-"))).toBe(false);
  });

  it("keeps mobile breakpoints aligned with the legacy public shell", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/components/layout/public-shell/public-nav.module.css"),
      "utf8",
    );

    expect(css).toContain("@media (max-width: 820px)");
    expect(css).toContain("@media (max-width: 520px)");
    expect(css).not.toContain("@media (max-width: 720px)");
    expect(css).toContain(".actions > a:first-child");
    expect(css).toContain("display: none;");
  });

  it("can render a brand-only public shell for auth pages", () => {
    const result = render(<PublicSiteNav active="pricing" fixed showActions={false} />);
    root = result.root;

    expect(result.container.querySelector("a[href='/']")?.textContent).toContain("AlphaCI");
    expect(result.container.querySelector("nav")).toBeNull();
    expect(result.container.querySelector("a[href='/login']")).toBeNull();
  });
});