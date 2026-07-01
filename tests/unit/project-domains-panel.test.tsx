import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ProjectDomainsPanel } from "../../src/components/product/project-domains-panel";
import type { RuntimeDomain } from "../../src/lib/api/domains";

function makeDomain(overrides: Partial<RuntimeDomain> = {}): RuntimeDomain {
  return {
    id: "domain-1",
    deploymentTargetId: "target-1",
    hostname: "alpha-demo-dev.itsandbox.site",
    domainBase: "itsandbox.site",
    kind: "generated",
    routingMode: "load_balancer",
    isPrimary: true,
    certificateStatus: "pending",
    dnsInstructions: {
      type: "CNAME",
      name: "alpha-demo-dev",
      value: "edge.itsandbox.site",
    },
    lastVerifiedAt: null,
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
    ...overrides,
  };
}

function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return { container, root };
}

describe("ProjectDomainsPanel", () => {
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

  it("renders managed and custom domain status without claiming pending SSL is active", () => {
    const rendered = render(
      <ProjectDomainsPanel
        expectedTarget="edge.itsandbox.site"
        domains={[
          makeDomain(),
          makeDomain({
            id: "domain-2",
            hostname: "api.customer.test",
            domainBase: "customer.test",
            kind: "custom",
            certificateStatus: "pending",
            dnsInstructions: {
              type: "CNAME",
              name: "api.customer.test",
              value: "edge.itsandbox.site",
              status: "missing",
            },
          }),
        ]}
      />,
    );
    root = rendered.root;
    container = rendered.container;

    expect(container.textContent).toContain("alpha-demo-dev.itsandbox.site");
    expect(container.textContent).toContain("api.customer.test");
    expect(container.textContent).toContain("Pending verification");
    expect(container.textContent).not.toContain("SSL active");
  });

  it("calls custom-domain and verify actions", () => {
    const add = jest.fn();
    const verify = jest.fn();
    const customDomain = makeDomain({
      id: "domain-2",
      hostname: "api.customer.test",
      domainBase: "customer.test",
      kind: "custom",
    });
    const rendered = render(
      <ProjectDomainsPanel
        domains={[customDomain]}
        expectedTarget="edge.itsandbox.site"
        onAddCustomDomain={add}
        onVerifyDomain={verify}
      />,
    );
    root = rendered.root;
    container = rendered.container;

    const buttons = Array.from(container.querySelectorAll("button"));
    act(() => buttons.find((button) => button.textContent === "Add custom domain")?.click());
    act(() => buttons.find((button) => button.textContent === "Verify")?.click());

    expect(add).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith(customDomain);
  });
});
