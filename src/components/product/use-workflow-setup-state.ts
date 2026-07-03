"use client";

import { useEffect, useState } from "react";

import type { UsageLimitItem } from "@/lib/api/contracts";
import { getMyUsage } from "@/lib/api/client";
import type { CreateProjectFormState } from "@/hooks/use-create-project-form";
import type { GithubInstallationsState } from "@/hooks/use-github-installations";
import type { ProjectOptionsCatalogState } from "@/hooks/use-project-options-catalog";

type SetupActionForm = Pick<CreateProjectFormState, "repoName" | "serviceName">;
type SetupActionGithub = Pick<GithubInstallationsState, "linkedRepos" | "linkedReposLoaded" | "loadingLinkedRepos">;
type SetupActionProjectCatalog = Pick<
  ProjectOptionsCatalogState,
  "isMicroservicesShape" | "isMultiRepoShape" | "loadingProjectOptions" | "selectedProjectType"
>;

interface WorkflowSetupActionStateInput {
  existingRepoFullName: string;
  form: SetupActionForm;
  github: SetupActionGithub;
  isCreatingProject: boolean;
  isDiscoveringExistingRepo: boolean;
  isExistingMode: boolean;
  isSettingUpExistingRepo: boolean;
  projectCatalog: SetupActionProjectCatalog;
  usageItems: UsageLimitItem[];
}

export function getWorkflowSetupActionState({
  existingRepoFullName,
  form,
  github,
  isCreatingProject,
  isDiscoveringExistingRepo,
  isExistingMode,
  isSettingUpExistingRepo,
  projectCatalog,
  usageItems,
}: Readonly<WorkflowSetupActionStateInput>) {
  const projectQuota = usageItems.find((item) => item.code === "projects") ?? null;
  const projectQuotaReached = Boolean(
    projectQuota &&
      projectQuota.limit > 0 &&
      projectQuota.current >= projectQuota.limit,
  );

  const createDisabled =
    isCreatingProject ||
    projectQuotaReached ||
    projectCatalog.loadingProjectOptions ||
    !form.repoName.trim() ||
    (!projectCatalog.isMicroservicesShape && !projectCatalog.isMultiRepoShape && !projectCatalog.selectedProjectType);

  const generateDisabled =
    isCreatingProject ||
    isDiscoveringExistingRepo ||
    isSettingUpExistingRepo ||
    projectCatalog.loadingProjectOptions ||
    !projectCatalog.selectedProjectType ||
    !(form.serviceName || form.repoName);

  const existingDiscoverDisabled =
    isDiscoveringExistingRepo ||
    isSettingUpExistingRepo ||
    projectCatalog.loadingProjectOptions ||
    !existingRepoFullName.trim();

  const existingSetupDisabled =
    isDiscoveringExistingRepo ||
    isSettingUpExistingRepo ||
    projectCatalog.loadingProjectOptions ||
    !existingRepoFullName.trim() ||
    !projectCatalog.selectedProjectType;

  const noLinkedRepos =
    isExistingMode &&
    github.linkedReposLoaded &&
    !github.loadingLinkedRepos &&
    github.linkedRepos.length === 0;

  return {
    createDisabled,
    existingDiscoverDisabled,
    existingSetupDisabled,
    generateDisabled,
    noLinkedRepos,
    projectQuota,
    projectQuotaReached,
  };
}

type UseWorkflowSetupStateOptions = Omit<WorkflowSetupActionStateInput, "usageItems">;

export function useWorkflowSetupState(options: Readonly<UseWorkflowSetupStateOptions>) {
  const [usageItems, setUsageItems] = useState<UsageLimitItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getMyUsage()
      .then((usage) => {
        if (!cancelled && usage.enabled) {
          setUsageItems(usage.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsageItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return getWorkflowSetupActionState({ ...options, usageItems });
}
