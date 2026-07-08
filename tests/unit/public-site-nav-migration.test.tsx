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

  it("keeps the responsive public shell contract in Tailwind classes", () => {
    const result = render(<PublicSiteNav active="pricing" fixed />);
    root = result.root;

    const header = result.container.querySelector("header");
    const primaryNav = result.container.querySelector("nav");
    const loginLink = result.container.querySelector("a[href='/login']");

    expect(header?.className).toContain("max-[820px]:px-4");
    expect(header?.className).toContain("max-[520px]:grid-cols-[auto_auto]");
    expect(primaryNav?.className).toContain("max-[520px]:col-span-full");
    expect(loginLink?.className).toContain("max-[520px]:hidden");
  });

  it("can render a brand-only public shell for auth pages", () => {
    const result = render(<PublicSiteNav active="pricing" fixed showActions={false} />);
    root = result.root;

    expect(result.container.querySelector("a[href='/']")?.textContent).toContain("AlphaCI");
    expect(result.container.querySelector("nav")).toBeNull();
    expect(result.container.querySelector("a[href='/login']")).toBeNull();
  });
});
