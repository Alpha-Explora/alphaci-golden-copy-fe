import {
  reserveCustomDomain,
  reserveManagedDomain,
  verifyRuntimeDomain,
} from "../../src/lib/api/domains";

const fetchMock = jest.fn();

describe("domains api", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "domain-1" }),
    });
  });

  it("posts managed domain reservations", async () => {
    await reserveManagedDomain({
      deploymentTargetId: "target-1",
      projectSlug: "alpha-demo",
      environment: "dev",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/runtime-domains/managed"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          deploymentTargetId: "target-1",
          projectSlug: "alpha-demo",
          environment: "dev",
        }),
      }),
    );
  });

  it("posts custom domain reservations and verification requests", async () => {
    await reserveCustomDomain({
      deploymentTargetId: "target-1",
      hostname: "api.customer.test",
      expectedTarget: "edge.itsandbox.site",
    });
    await verifyRuntimeDomain({
      domainId: "domain-1",
      hostname: "api.customer.test",
      expectedTarget: "edge.itsandbox.site",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/v1/runtime-domains/custom"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/v1/runtime-domains/verify"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
