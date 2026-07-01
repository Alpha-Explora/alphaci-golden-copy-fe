import { getAdminGcpRuntimeProjects } from "../../src/lib/api/admin-gcp-runtime";

describe("admin GCP runtime API", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0 }),
    } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (global as typeof globalThis & { fetch?: typeof fetch }).fetch;
  });

  it("requests admin runtime projects with filters", async () => {
    await getAdminGcpRuntimeProjects({
      status: "drifted",
      runtimePlacement: "shared_project",
      owner: "anton",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/admin/gcp-runtime?status=drifted&runtimePlacement=shared_project&owner=anton",
      ),
      expect.any(Object),
    );
  });
});