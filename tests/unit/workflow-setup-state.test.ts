import { getWorkflowSetupActionState } from "../../src/components/product/use-workflow-setup-state";
import type { LinkedGitHubRepo, ProjectTypeOption, UsageLimitItem } from "../../src/lib/api/contracts";

function usageItem(overrides: Partial<UsageLimitItem>): UsageLimitItem {
  return {
    code: "projects",
    current: 0,
    limit: 10,
    upgradeRequired: false,
    ...overrides,
  };
}

const selectedProjectType: ProjectTypeOption = {
  allowedRecipes: ["backend-api-ci"],
  defaultOptions: {
    build: false,
    coverage: true,
    lint: true,
    security: true,
    unit: true,
  },
  defaultRecipe: "backend-api-ci",
  framework: "nestjs",
  id: "nestjs-api",
  kind: "backend",
  label: "NestJS API",
  language: "typescript",
  repoShapes: ["single-app"],
  runtime: "node",
};

const linkedRepo: LinkedGitHubRepo = {
  installationId: 101,
  repoFullName: "tone/api",
};

const baseInput = {
  existingRepoFullName: "tone/api",
  form: {
    repoName: "orders-api",
    serviceName: "orders-api",
  },
  github: {
    linkedRepos: [linkedRepo],
    linkedReposLoaded: true,
    loadingLinkedRepos: false,
  },
  isCreatingProject: false,
  isDiscoveringExistingRepo: false,
  isExistingMode: false,
  isSettingUpExistingRepo: false,
  projectCatalog: {
    isMicroservicesShape: false,
    isMultiRepoShape: false,
    loadingProjectOptions: false,
    selectedProjectType,
  },
  usageItems: [usageItem({ current: 1, limit: 5 })],
};

describe("workflow setup action state", () => {
  it("disables repository creation when the project quota is reached", () => {
    const state = getWorkflowSetupActionState({
      ...baseInput,
      usageItems: [usageItem({ current: 5, limit: 5, upgradeRequired: true })],
    });

    expect(state.projectQuotaReached).toBe(true);
    expect(state.createDisabled).toBe(true);
    expect(state.generateDisabled).toBe(false);
  });

  it("disables create and generate while project options are loading", () => {
    const state = getWorkflowSetupActionState({
      ...baseInput,
      projectCatalog: {
        ...baseInput.projectCatalog,
        loadingProjectOptions: true,
      },
    });

    expect(state.createDisabled).toBe(true);
    expect(state.generateDisabled).toBe(true);
    expect(state.existingDiscoverDisabled).toBe(true);
    expect(state.existingSetupDisabled).toBe(true);
  });

  it("reports existing mode with no linked repositories", () => {
    const state = getWorkflowSetupActionState({
      ...baseInput,
      github: {
        linkedRepos: [],
        linkedReposLoaded: true,
        loadingLinkedRepos: false,
      },
      isExistingMode: true,
    });

    expect(state.noLinkedRepos).toBe(true);
  });
});
