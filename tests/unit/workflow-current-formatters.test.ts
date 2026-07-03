import { selectedChecks, statusVariant } from "../../src/components/product/workflow-current-formatters";
import type { ProvisionedProject } from "../../src/lib/api/contracts";

const baseProject: ProvisionedProject = {
  id: "project-1",
  repoFullName: "acme/orders-api",
  templateId: "nestjs-api",
  serviceName: "orders-api",
  workflowPath: ".github/workflows/00-alphaci.yml",
  status: "provisioned",
  githubCommitSha: "abc123",
  githubCommitUrl: null,
  failureReason: null,
};

describe("workflow current formatters", () => {
  it("formats selected project checks from enabled options", () => {
    const project = {
      ...baseProject,
      projectOptions: {
        lint: true,
        test: false,
        security: true,
      },
    } satisfies ProvisionedProject;

    expect(selectedChecks(project)).toBe("lint, security");
  });

  it("uses None when no project checks are enabled", () => {
    expect(selectedChecks({ ...baseProject, projectOptions: { lint: false } })).toBe("None");
    expect(selectedChecks(baseProject)).toBe("None");
  });

  it("maps project status to existing visual variants", () => {
    expect(statusVariant("provisioned")).toBe("provisioned");
    expect(statusVariant("provisioning")).toBe("provisioning");
    expect(statusVariant("pending")).toBe("provisioning");
    expect(statusVariant("failed")).toBe("failed");
  });
});
