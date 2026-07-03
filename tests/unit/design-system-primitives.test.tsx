import fs from "fs";
import path from "path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { Badge } from "../../src/components/ui/badge";
import { Button, ButtonLink } from "../../src/components/ui/button";
import { Card } from "../../src/components/ui/card";
import { PublicLink } from "../../src/components/ui/public-link";
import { Logo, PixelWordmark } from "../../src/components/brand";
import { PublicNav } from "../../src/components/layout/public-shell/public-nav";
import { SkipLink } from "../../src/components/layout/public-shell/skip-link";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

describe("design-system primitives", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders a typed button with stable variant, size, and loading state", () => {
    const result = render(<Button variant="primary" size="sm" loading>Save</Button>);
    root = result.root;

    const button = result.container.querySelector("button");
    expect(button).toHaveTextContent("Save");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(button?.className).toContain("button");
    expect(button?.className).toContain("primary");
    expect(button?.className).toContain("sm");
  });

  it("renders a typed button link with the same variant contract", () => {
    const result = render(<ButtonLink href="/workflows" variant="ghost" size="sm">Create project</ButtonLink>);
    root = result.root;

    const link = result.container.querySelector("a");
    expect(link).toHaveAttribute("href", "/workflows");
    expect(link).toHaveTextContent("Create project");
    expect(link?.className).toContain("button");
    expect(link?.className).toContain("ghost");
    expect(link?.className).toContain("sm");

    const buttonStyles = fs.readFileSync(path.join(process.cwd(), "src/components/ui/button/button.module.css"), "utf8");
    expect(buttonStyles).toMatch(/\.button\s*{[\s\S]*text-decoration:\s*none;/);
  });

  it("renders public links with active state and optional chevron", () => {
    const result = render(<PublicLink href="/pricing" active showChevron>Pricing</PublicLink>);
    root = result.root;

    const link = result.container.querySelector("a");
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link?.querySelector("[aria-hidden='true']")).toHaveTextContent(">");
  });

  it("renders badge and card primitives with predictable surface classes", () => {
    const result = render(
      <Card variant="dashboard">
        <Badge tone="success" dot>passing</Badge>
      </Card>,
    );
    root = result.root;

    const card = result.container.querySelector("section");
    const badge = result.container.querySelector("span");
    expect(card?.className).toContain("dashboard");
    expect(badge).toHaveTextContent("passing");
    expect(badge?.className).toContain("success");
  });

  it("renders logo primitives as decorative or accessible brand marks", () => {
    const decorative = render(<Logo decorative size={24} />);
    root = decorative.root;
    const image = decorative.container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden", "true");

    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";

    const labelled = render(<PixelWordmark text="AlphaCI" />);
    root = labelled.root;
    expect(labelled.container.textContent).toBe("AlphaCI");
  });

  it("renders public shell primitives without route-specific globals", () => {
    const result = render(
      <>
        <SkipLink href="#main">Skip to main content</SkipLink>
        <PublicNav active="pricing" />
      </>,
    );
    root = result.root;

    expect(result.container.querySelector(".skip-link")).toHaveAttribute("href", "#main");
    expect(result.container.querySelector("nav")?.textContent).toContain("Pricing");
    expect(result.container.querySelector("a[href='/signup']")?.textContent).toContain("Sign Up");
  });
});
