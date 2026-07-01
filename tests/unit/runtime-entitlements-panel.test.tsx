import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { RuntimeEntitlementsPanel, type RuntimeEntitlements } from "../../src/components/product/runtime-entitlements-panel";

const entitlements: RuntimeEntitlements = {
  canDeploy: true,
  canCreatePreview: true,
  canAttachCustomDomain: false,
  canCreateDedicatedProject: false,
  previewLimit: 1,
  customDomainLimit: 0,
  maxInstances: 2,
  deploysPerHour: 6,
  projectVisible: true,
  retainEnvVars: true,
  retainExistingCustomDomains: false,
  retainExistingDedicatedRuntime: false,
  customerDatabaseManagedByAlphaCI: false,
  cleanupDestructive: false,
  limitReasons: ["CUSTOM_DOMAINS_REQUIRE_PRODUCTION_BUSINESS"],
};

function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return { container, root };
}

describe("RuntimeEntitlementsPanel", () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = null;
    container = null;
  });

  it("shows current runtime abilities and blocked reasons", () => {
    const rendered = render(<RuntimeEntitlementsPanel entitlements={entitlements} />);
    root = rendered.root;
    container = rendered.container;

    expect(container.textContent).toContain("Deploys allowed");
    expect(container.textContent).toContain("Previews 1");
    expect(container.textContent).toContain("Custom domains unavailable");
    expect(container.textContent).toContain("CUSTOM_DOMAINS_REQUIRE_PRODUCTION_BUSINESS");
    expect(container.textContent).toContain("Max instances 2");
  });

  it("makes destructive cleanup and database ownership explicit", () => {
    const rendered = render(<RuntimeEntitlementsPanel entitlements={{ ...entitlements, canDeploy: false }} />);
    root = rendered.root;
    container = rendered.container;

    expect(container.textContent).toContain("Deploys blocked");
    expect(container.textContent).toContain("Env vars retained");
    expect(container.textContent).toContain("Customer database external");
    expect(container.textContent).toContain("No destructive cleanup");
  });
});
