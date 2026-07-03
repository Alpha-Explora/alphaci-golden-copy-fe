"use client";

import { useEffect, useMemo, useState } from "react";

import { getProjectOverview, syncProjectSnapshot } from "@/lib/api/projects";
import type {
  DeploymentTarget,
  ProjectOverviewResponse,
  ProvisionedProject,
} from "@/lib/api/contracts";

interface UseWorkflowProjectOverviewOptions {
  projectSyncSnapshotsEnabled: boolean;
  projects: ProvisionedProject[];
  selectedProjectId: string | null;
}

export function useWorkflowProjectOverview({
  projectSyncSnapshotsEnabled,
  projects,
  selectedProjectId,
}: Readonly<UseWorkflowProjectOverviewOptions>) {
  const [projectOverview, setProjectOverview] = useState<ProjectOverviewResponse | null>(null);
  const [projectOverviewError, setProjectOverviewError] = useState<{
    projectId: string;
    message: string;
  } | null>(null);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;
  }, [projects, selectedProjectId]);

  const selectedOverview = selectedProject && projectOverview?.project.id === selectedProject.id
    ? projectOverview
    : null;
  const selectedOverviewError = selectedProject && projectOverviewError?.projectId === selectedProject.id
    ? projectOverviewError.message
    : null;
  const loadingProjectOverview = Boolean(selectedProject && !selectedOverview && !selectedOverviewError);
  const selectedWorkflowFiles = selectedOverview?.workflow.files ?? selectedProject?.workflowFiles ?? [];
  const deploymentTargets = selectedOverview?.deploymentTargets.items ?? [];
  const envMetadata = selectedOverview?.environment.items ?? [];
  const syncSnapshot = selectedOverview?.syncSnapshot ?? null;
  const syncAvailable =
    projectSyncSnapshotsEnabled &&
    selectedOverview?.capabilities.syncSnapshots === true &&
    syncSnapshot?.enabled === true;

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    let active = true;
    void getProjectOverview(selectedProject.id)
      .then((overview) => {
        if (active) {
          setProjectOverview(overview);
          setProjectOverviewError(null);
        }
      })
      .catch(() => {
        if (active) {
          setProjectOverviewError({
            projectId: selectedProject.id,
            message: "Unable to load project overview.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedProject]);

  const handleTargetChanged = (target: DeploymentTarget) => {
    if (!selectedProject) return;
    setProjectOverview((current) => {
      if (!current || current.project.id !== selectedProject.id) return current;
      const items = current.deploymentTargets.items.map((item) =>
        item.id === target.id ? target : item,
      );
      return {
        ...current,
        deploymentTargets: {
          ...current.deploymentTargets,
          items,
        },
      };
    });
  };

  const handleTargetDetached = (targetId: string) => {
    if (!selectedProject) return;
    setProjectOverview((current) => {
      if (!current || current.project.id !== selectedProject.id) return current;
      const items = current.deploymentTargets.items.filter((item) => item.id !== targetId);
      return {
        ...current,
        deploymentTargets: {
          ...current.deploymentTargets,
          items,
          count: items.length,
        },
      };
    });
  };

  async function handleProjectSync() {
    if (!selectedProject || !syncAvailable) {
      return;
    }

    setSyncingProjectId(selectedProject.id);
    setSyncMessage(null);
    try {
      const result = await syncProjectSnapshot(selectedProject.id);
      setProjectOverview(result.overview);
    } catch {
      setSyncMessage("Unable to create local snapshot right now.");
    } finally {
      setSyncingProjectId(null);
    }
  }

  return {
    deploymentTargets,
    envMetadata,
    handleProjectSync,
    handleTargetChanged,
    handleTargetDetached,
    loadingProjectOverview,
    selectedOverview,
    selectedOverviewError,
    selectedProject,
    selectedWorkflowFiles,
    syncAvailable,
    syncMessage,
    syncingProjectId,
    syncSnapshot,
  };
}
