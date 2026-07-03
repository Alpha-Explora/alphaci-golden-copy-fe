import {
  addVariableGroup,
  fallbackTarget,
  targetBranchKey,
  targetScopeIncludes,
  toggleGroupTargetBranch,
  updateEnvVar,
  variableGroupsForValue,
  withRenderDefaults,
} from "../../src/components/product/deployment-provisioning-utils";
import type {
  DeploymentProvisioningEnvSet,
  DeploymentProvisioningRequest,
  DeploymentProvisioningVariableGroup,
} from "../../src/lib/api/contracts";

describe("deployment provisioning utilities", () => {
  it("builds managed fallback targets with provider-specific defaults", () => {
    expect(fallbackTarget("backend")).toEqual(
      expect.objectContaining({
        dockerContext: "backend",
        dockerfilePath: "backend/Dockerfile",
        ownershipMode: "flowci_managed",
        provider: "render",
        renderDeployMethod: "managed_image",
        slot: "backend",
      }),
    );

    expect(fallbackTarget("frontend")).toEqual(
      expect.objectContaining({
        ownershipMode: "flowci_managed",
        provider: "vercel",
        slot: "frontend",
      }),
    );
  });

  it("keeps variable-group mutations separate from shared env fallback state", () => {
    const value: DeploymentProvisioningRequest = {
      enabled: true,
      sharedEnv: [{ environment: "test", vars: [{ key: "DATABASE_URL", value: "postgres://local" }] }],
      targets: [],
    };

    const groups = variableGroupsForValue(value, ["render", "vercel"]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual(
      expect.objectContaining({
        appliesTo: "all",
        provider: "render",
      }),
    );

    const updated = addVariableGroup(value, groups, "render");
    expect(updated.sharedEnv).toBeUndefined();
    expect(updated.variableGroups).toHaveLength(3);
    expect(updated.variableGroups?.[2]).toEqual(
      expect.objectContaining({
        name: "Render variable group 2",
        provider: "render",
      }),
    );
  });

  it("toggles selected target branches without mutating the source group", () => {
    const group: DeploymentProvisioningVariableGroup = {
      appliesTo: "selected",
      env: [{ environment: "test", vars: [] }],
      provider: "render",
      targetBranches: ["backend:render:test"],
    };

    const toggled = toggleGroupTargetBranch(group, "frontend:render:test", [
      "backend:render:test",
      "frontend:render:test",
    ]);

    expect(group.targetBranches).toEqual(["backend:render:test"]);
    expect(toggled.targetBranches).toEqual(["backend:render:test", "frontend:render:test"]);
    expect(targetScopeIncludes(toggled, "frontend:render:test")).toBe(true);
  });

  it("normalizes Render defaults and env row edits without mutating inputs", () => {
    const envSet: DeploymentProvisioningEnvSet = {
      environment: "test",
      vars: [{ key: "DATABASE_URL", value: "" }],
    };

    const nextEnvSet = updateEnvVar(envSet, 0, { value: "postgres://local" });
    expect(envSet.vars[0]?.value).toBe("");
    expect(nextEnvSet.vars[0]).toEqual({ key: "DATABASE_URL", value: "postgres://local" });

    const patch = withRenderDefaults(
      {
        branchName: "test",
        buildCommand: "npm run build",
        env: [envSet],
        ownershipMode: "flowci_managed",
        provider: "vercel",
        slot: "frontend",
      },
      { provider: "render", slot: "backend" },
    );

    expect(patch).toEqual(
      expect.objectContaining({
        dockerContext: "backend",
        dockerfilePath: "backend/Dockerfile",
        renderDeployMethod: "managed_image",
        renderRuntime: "docker",
      }),
    );
    expect(targetBranchKey({ ...fallbackTarget("backend"), branchName: "uat" })).toBe("backend:render:uat");
  });
});
