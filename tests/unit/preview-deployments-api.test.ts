import { listPreviewDeployments, requestPreviewCleanup } from "../../src/lib/api/previews";

describe("preview deployments api", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("lists preview deployments for a project", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "preview-1" }],
    });

    await expect(listPreviewDeployments("project-1")).resolves.toEqual([{ id: "preview-1" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/previews/projects/project-1"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests preview cleanup without sending secret values", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "preview-1", cleanupStatus: "pending" }),
    });

    await requestPreviewCleanup("preview-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/previews/preview-1/cleanup"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain("DATABASE_URL");
  });
});
