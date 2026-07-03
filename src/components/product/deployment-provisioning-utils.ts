import type {
  DeploymentProvisioningEnvSet,
  DeploymentProvisioningRequest,
  DeploymentProvisioningTargetRequest,
  DeploymentProvisioningVariableGroup,
  EnvEnvironment,
  EnvProvider,
  EnvTargetSlot,
  RenderDeployMethod,
  RenderRuntime,
} from "@/lib/api/contracts";

export const environments: EnvEnvironment[] = ["test", "uat", "production"];
export const renderRuntimeOptions: Array<{ value: RenderRuntime; label: string }> = [
  { value: "docker", label: "Dockerfile" },
  { value: "node", label: "Node.js / Bun" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "elixir", label: "Elixir" },
];

const legacyRenderDeployMethods: RenderDeployMethod[] = ["native_git", "byo_image", "existing_service"];

export function blankEnvSet(environment: EnvEnvironment = "test"): DeploymentProvisioningEnvSet {
  return { environment, vars: [] };
}

export function fallbackTarget(selectedProjectKind?: "frontend" | "backend"): DeploymentProvisioningTargetRequest {
  const slot: EnvTargetSlot =
    selectedProjectKind === "frontend" ? "frontend" : selectedProjectKind === "backend" ? "backend" : "standalone";
  const provider: EnvProvider = slot === "frontend" ? "vercel" : "render";
  return {
    slot,
    provider,
    ownershipMode: "flowci_managed",
    branchName: "test",
    rootDirectory: provider === "render" && slot === "backend" ? "backend" : ".",
    buildCommand: "npm run build",
    startCommand: provider === "render" ? "npm run start" : undefined,
    renderDeployMethod: provider === "render" ? "managed_image" : undefined,
    renderServiceType: provider === "render" ? "web_service" : undefined,
    renderRuntime: provider === "render" ? "docker" : undefined,
    renderInstanceType: provider === "render" ? "free" : undefined,
    renderRegion: provider === "render" ? "singapore" : undefined,
    renderEnvironmentName: "test",
    dockerContext: provider === "render" && slot === "backend" ? "backend" : provider === "render" ? "." : undefined,
    dockerfilePath: provider === "render" && slot === "backend" ? "backend/Dockerfile" : provider === "render" ? "Dockerfile" : undefined,
    env: [{ environment: "test", vars: [] }],
  };
}

export function updateTargetAt(
  value: DeploymentProvisioningRequest,
  index: number,
  patch: Partial<DeploymentProvisioningTargetRequest>,
  currentTargets = value.targets,
): DeploymentProvisioningRequest {
  return {
    ...value,
    targets: currentTargets.map((target, currentIndex) =>
      asAlphaCIManagedTarget(currentIndex === index ? { ...target, ...patch } : target),
    ),
  };
}

export function updateEnvSet(
  target: DeploymentProvisioningTargetRequest,
  envSet: DeploymentProvisioningEnvSet,
): DeploymentProvisioningTargetRequest {
  return {
    ...target,
    env: [envSet],
  };
}

export function updateEnvVar(
  envSet: DeploymentProvisioningEnvSet,
  index: number,
  patch: Partial<{ key: string; value: string }>,
): DeploymentProvisioningEnvSet {
  const vars = [...envSet.vars];
  const current = vars[index] ?? { key: "", value: "" };
  vars[index] = { ...current, ...patch };
  return { ...envSet, vars };
}

export function envVarsForDisplay(envSet: DeploymentProvisioningEnvSet): Array<{ key: string; value: string }> {
  return envSet.vars.length > 0 ? envSet.vars : [{ key: "", value: "" }];
}

export function providerLabel(provider: EnvProvider): string {
  return provider === "render" ? "Render" : "Vercel";
}

export function blankVariableGroup(provider: EnvProvider, index = 1): DeploymentProvisioningVariableGroup {
  return {
    name: `${providerLabel(provider)} variable group ${index}`,
    provider,
    appliesTo: "all",
    env: [blankEnvSet()],
  };
}

export function variableGroupsForValue(
  value: DeploymentProvisioningRequest,
  providers: EnvProvider[],
): DeploymentProvisioningVariableGroup[] {
  if (value.variableGroups?.length) {
    const fallbackProvider = providers[0] ?? "render";
    return value.variableGroups.map((group) => ({
      ...group,
      provider: group.provider ?? fallbackProvider,
    }));
  }

  if (value.sharedEnv?.length) {
    const sharedEnv = value.sharedEnv;
    return providers.map((provider) => ({
      name: `${providerLabel(provider)} shared variables`,
      provider,
      appliesTo: "all",
      env: sharedEnv,
    }));
  }

  return [];
}

export function updateVariableGroupAt(
  value: DeploymentProvisioningRequest,
  currentGroups: DeploymentProvisioningVariableGroup[],
  index: number,
  group: DeploymentProvisioningVariableGroup,
): DeploymentProvisioningRequest {
  const nextGroups = [...currentGroups];
  nextGroups[index] = group;
  return { ...value, variableGroups: nextGroups, sharedEnv: undefined };
}

export function addVariableGroup(
  value: DeploymentProvisioningRequest,
  currentGroups: DeploymentProvisioningVariableGroup[],
  provider: EnvProvider,
): DeploymentProvisioningRequest {
  const providerGroupCount = currentGroups.filter((group) => group.provider === provider).length;
  return {
    ...value,
    variableGroups: [...currentGroups, blankVariableGroup(provider, providerGroupCount + 1)],
    sharedEnv: undefined,
  };
}

export function removeVariableGroup(
  value: DeploymentProvisioningRequest,
  currentGroups: DeploymentProvisioningVariableGroup[],
  index: number,
): DeploymentProvisioningRequest {
  const nextGroups = currentGroups.filter((_, currentIndex) => currentIndex !== index);
  return { ...value, variableGroups: nextGroups, sharedEnv: undefined };
}

export function countVars(envSets: DeploymentProvisioningEnvSet[] | undefined): number {
  return (envSets ?? []).reduce(
    (total, envSet) => total + envSet.vars.filter((variable) => variable.key.trim() && variable.value).length,
    0,
  );
}

export function targetBranchKey(target: DeploymentProvisioningTargetRequest): string {
  const branch = target.branchName?.trim() || "test";
  return `${target.slot}:${target.provider}:${branch}`;
}

export function targetBranchLabel(target: DeploymentProvisioningTargetRequest): string {
  const branch = target.branchName?.trim() || "test";
  return `${target.slot} / ${target.provider} / ${branch}`;
}

export function targetScopeIncludes(group: DeploymentProvisioningVariableGroup, targetKey: string): boolean {
  return group.appliesTo !== "selected" || (group.targetBranches ?? []).includes(targetKey);
}

export function toggleGroupTargetBranch(
  group: DeploymentProvisioningVariableGroup,
  targetKey: string,
  allTargetKeys: string[],
): DeploymentProvisioningVariableGroup {
  const selected = new Set(group.targetBranches?.length ? group.targetBranches : allTargetKeys);
  if (selected.has(targetKey)) {
    selected.delete(targetKey);
  } else {
    selected.add(targetKey);
  }

  return {
    ...group,
    appliesTo: "selected",
    targetBranches: [...selected],
  };
}

export function defaultProjectPlaceholder(repoShape: string, target: DeploymentProvisioningTargetRequest) {
  if (repoShape === "multi" || repoShape === "microservices") {
    return target.slot === "frontend" ? "app-frontend-test" : "app-backend-test";
  }
  return "project-name-test";
}

export function ownershipDescription(target: DeploymentProvisioningTargetRequest) {
  if (target.provider === "render") {
    return "AlphaCI packages and deploys this backend automatically.";
  }

  return "AlphaCI creates the Vercel project and deploys it through GitHub Actions from the generated workflow.";
}

export function asAlphaCIManagedTarget(
  target: DeploymentProvisioningTargetRequest,
): DeploymentProvisioningTargetRequest {
  const renderDeployMethod =
    target.provider === "render" && (!target.renderDeployMethod || legacyRenderDeployMethods.includes(target.renderDeployMethod))
      ? "managed_image"
      : target.renderDeployMethod;

  return {
    ...target,
    action: target.action === "register_existing" ? "create" : target.action,
    ownershipMode: "flowci_managed",
    providerConnectionId: undefined,
    renderDeployMethod,
  };
}

export function withRenderDefaults(
  target: DeploymentProvisioningTargetRequest,
  patch: Partial<DeploymentProvisioningTargetRequest>,
): Partial<DeploymentProvisioningTargetRequest> {
  const nextProvider = patch.provider ?? target.provider;
  const nextSlot = patch.slot ?? target.slot;
  if (nextProvider !== "render") {
    return patch;
  }

  const isBackendSubdir = nextSlot === "backend";
  const rootDirectory = patch.rootDirectory ?? target.rootDirectory ?? (isBackendSubdir ? "backend" : ".");

  return {
    renderDeployMethod: target.renderDeployMethod ?? "managed_image",
    renderServiceType: target.renderServiceType ?? "web_service",
    renderRuntime: target.renderRuntime ?? "docker",
    renderInstanceType: target.renderInstanceType ?? "free",
    renderRegion: target.renderRegion ?? "singapore",
    renderEnvironmentName: target.renderEnvironmentName ?? "test",
    dockerContext: target.dockerContext ?? rootDirectory,
    dockerfilePath: target.dockerfilePath ?? (rootDirectory === "." ? "Dockerfile" : `${rootDirectory}/Dockerfile`),
    startCommand: target.startCommand ?? "npm run start",
    ...patch,
  };
}
