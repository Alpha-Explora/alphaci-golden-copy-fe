import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import AdminGcpRuntimePage from "../../src/app/admin/gcp-runtime/page";
import * as api from "../../src/lib/api/admin-gcp-runtime";

jest.mock("../../src/lib/api/admin-gcp-runtime");

const mockedApi = jest.mocked(api);

function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return { container, root };
}

describe("AdminGcpRuntimePage", () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  beforeEach(() => {
    mockedApi.getAdminGcpRuntimeProjects.mockResolvedValue({
      total: 1,
      items: [
        {
          workspace: { id: "workspace-1", name: "AlphaExplora" },
          project: {
            id: "project-1",
            repository: "alpha/demo",
            ownerLogin: "anton",
          },
          runtime: {
            placement: "shared_project",
            environment: "prod",
            serviceSlot: "web",
            deploymentStatus: "drifted",
            provisioningStatus: "provisioned",
            gcpProjectId: "alphaci-shared-prod",
            region: "asia-southeast1",
            cloudRunServiceName: "alpha-demo-prod",
          },
          reconciliation: {
            status: "drifted",
            checkedAt: "2026-07-02T01:00:00.000Z",
            errorCode: "CLOUD_RUN_SERVICE_MISSING",
          },
          lastProvisioningJob: {
            id: "job-1",
            type: "reconcile_runtime",
            status: "failed",
            updatedAt: "2026-07-02T01:01:00.000Z",
            errorCode: "missing_service",
          },
          domain: {
            hostname: "alpha-demo.itsandbox.site",
            kind: "generated_default",
            certificateStatus: "active",
          },
          previewCount: 2,
          blockedEntitlementReason: "PAYMENT_PAST_DUE",
          lastAuditEvent: {
            code: "gcp.runtime.reconcile.drifted",
            message: "Runtime drift detected",
            createdAt: "2026-07-02T01:02:00.000Z",
          },
          needsAttention: true,
        },
      ],
    });
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = null;
    container = null;
    jest.clearAllMocks();
  });

  it("renders operational runtime visibility without claiming live GCP access", async () => {
    await act(async () => {
      const rendered = render(<AdminGcpRuntimePage />);
      root = rendered.root;
      container = rendered.container;
    });

    expect(container?.textContent).toContain("GCP Runtime");
    expect(container?.textContent).toContain("alpha/demo");
    expect(container?.textContent).toContain("shared_project");
    expect(container?.textContent).toContain("drifted");
    expect(container?.textContent).toContain("alpha-demo.itsandbox.site");
    expect(container?.textContent).toContain("PAYMENT_PAST_DUE");
    expect(container?.textContent).toContain("CLOUD_RUN_SERVICE_MISSING");
    expect(container?.textContent).toContain("Live GCP mutation is still access-gated");
  });

  it("filters by status, placement, and owner", async () => {
    await act(async () => {
      const rendered = render(<AdminGcpRuntimePage />);
      root = rendered.root;
      container = rendered.container;
    });

    const [status, placement, owner] = Array.from(
      container?.querySelectorAll("select, input") ?? [],
    ) as Array<HTMLSelectElement | HTMLInputElement>;

    await act(async () => {
      status.value = "drifted";
      status.dispatchEvent(new Event("change", { bubbles: true }));
      placement.value = "shared_project";
      placement.dispatchEvent(new Event("change", { bubbles: true }));
      owner.value = "anton";
      owner.dispatchEvent(new Event("input", { bubbles: true }));
      container?.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(mockedApi.getAdminGcpRuntimeProjects).toHaveBeenLastCalledWith({
      status: "drifted",
      runtimePlacement: "shared_project",
      owner: "anton",
    });
  });
});