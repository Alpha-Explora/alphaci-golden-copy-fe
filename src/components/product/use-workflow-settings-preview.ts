"use client";

import { useEffect, useState } from "react";

import {
  createWorkflowUpdatePullRequest,
  getWorkflowSettings,
  previewWorkflowSettings,
} from "@/lib/api/projects";
import type {
  ProvisionedProject,
  WorkflowSettings,
  WorkflowSettingsPreviewResponse,
  WorkflowUpdatePullRequestResponse,
} from "@/lib/api/contracts";

interface UseWorkflowSettingsPreviewOptions {
  selectedProject: ProvisionedProject | null;
  workflowSettingsPreviewEnabled: boolean;
  workflowTabActive: boolean;
}

export function useWorkflowSettingsPreview({
  selectedProject,
  workflowSettingsPreviewEnabled,
  workflowTabActive,
}: Readonly<UseWorkflowSettingsPreviewOptions>) {
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings | null>(null);
  const [workflowSettingsProjectId, setWorkflowSettingsProjectId] = useState<string | null>(null);
  const [workflowSettingsError, setWorkflowSettingsError] = useState<string | null>(null);
  const [workflowPreview, setWorkflowPreview] = useState<WorkflowSettingsPreviewResponse | null>(null);
  const [workflowUpdatePr, setWorkflowUpdatePr] = useState<WorkflowUpdatePullRequestResponse | null>(null);
  const [workflowUpdatePrError, setWorkflowUpdatePrError] = useState<string | null>(null);
  const [creatingWorkflowPr, setCreatingWorkflowPr] = useState(false);
  const [previewingWorkflow, setPreviewingWorkflow] = useState(false);

  useEffect(() => {
    if (!selectedProject || !workflowTabActive || !workflowSettingsPreviewEnabled) {
      return;
    }

    if (workflowSettingsProjectId === selectedProject.id && workflowSettings) {
      return;
    }

    let active = true;
    void getWorkflowSettings(selectedProject.id)
      .then((response) => {
        if (active) {
          setWorkflowSettings(response.settings);
          setWorkflowSettingsProjectId(selectedProject.id);
          setWorkflowSettingsError(null);
          setWorkflowPreview(null);
          setWorkflowUpdatePr(null);
          setWorkflowUpdatePrError(null);
        }
      })
      .catch(() => {
        if (active) {
          setWorkflowSettingsError("Unable to load workflow settings.");
        }
      });

    return () => {
      active = false;
    };
  }, [
    selectedProject,
    workflowSettings,
    workflowSettingsPreviewEnabled,
    workflowSettingsProjectId,
    workflowTabActive,
  ]);

  async function handleWorkflowPreview() {
    if (!selectedProject || !workflowSettings) {
      return;
    }

    setPreviewingWorkflow(true);
    setWorkflowSettingsError(null);
    try {
      const result = await previewWorkflowSettings(selectedProject.id, workflowSettings);
      setWorkflowPreview(result);
      setWorkflowSettings(result.settings);
      setWorkflowUpdatePr(null);
      setWorkflowUpdatePrError(null);
    } catch {
      setWorkflowSettingsError("Unable to preview workflow settings.");
    } finally {
      setPreviewingWorkflow(false);
    }
  }

  async function handleCreateWorkflowPr() {
    if (!selectedProject || !workflowSettings || !workflowPreview) {
      return;
    }

    setCreatingWorkflowPr(true);
    setWorkflowUpdatePrError(null);
    try {
      const result = await createWorkflowUpdatePullRequest(selectedProject.id, workflowSettings);
      setWorkflowUpdatePr(result);
    } catch {
      setWorkflowUpdatePrError("Unable to create workflow update PR.");
    } finally {
      setCreatingWorkflowPr(false);
    }
  }

  return {
    creatingWorkflowPr,
    handleCreateWorkflowPr,
    handleWorkflowPreview,
    previewingWorkflow,
    setWorkflowSettings,
    workflowPreview,
    workflowSettings,
    workflowSettingsError,
    workflowUpdatePr,
    workflowUpdatePrError,
  };
}
