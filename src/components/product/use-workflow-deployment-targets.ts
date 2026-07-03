"use client";

import { useEffect, useRef, useState } from "react";

import {
  detachDeploymentTarget,
  syncDeploymentTarget,
  updateDeploymentTarget,
} from "@/lib/api/projects";
import type {
  DeploymentTarget,
  UpdateDeploymentTargetRequest,
} from "@/lib/api/contracts";

interface UseWorkflowDeploymentTargetsOptions {
  onDetached: (targetId: string) => void;
  onTargetChanged: (target: DeploymentTarget) => void;
  projectId: string;
}

export function useWorkflowDeploymentTargets({
  onDetached,
  onTargetChanged,
  projectId,
}: Readonly<UseWorkflowDeploymentTargetsOptions>) {
  const [editingTarget, setEditingTarget] = useState<DeploymentTarget | null>(null);
  const [editValues, setEditValues] = useState<UpdateDeploymentTargetRequest>({});
  const editValuesRef = useRef<UpdateDeploymentTargetRequest>({});
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null);
  const [syncingTargetId, setSyncingTargetId] = useState<string | null>(null);
  const [detachConfirmTargetId, setDetachConfirmTargetId] = useState<string | null>(null);
  const [detachingTargetId, setDetachingTargetId] = useState<string | null>(null);
  const [targetMessage, setTargetMessage] = useState<string | null>(null);

  useEffect(() => {
    editValuesRef.current = {};
    setEditingTarget(null);
    setEditValues({});
    setSavingTargetId(null);
    setSyncingTargetId(null);
    setDetachConfirmTargetId(null);
    setDetachingTargetId(null);
    setTargetMessage(null);
  }, [projectId]);

  const openEdit = (target: DeploymentTarget) => {
    const nextValues = {
      slot: target.slot,
      providerProjectName: target.providerProjectName,
      branchName: target.branchName,
      rootDirectory: target.rootDirectory ?? "",
      buildCommand: target.buildCommand ?? "",
      startCommand: target.startCommand ?? "",
      renderEnvironmentName: target.renderEnvironmentName ?? null,
    };
    setEditingTarget(target);
    editValuesRef.current = nextValues;
    setEditValues(nextValues);
    setTargetMessage(null);
  };

  const updateEditValue = <K extends keyof UpdateDeploymentTargetRequest>(
    key: K,
    value: UpdateDeploymentTargetRequest[K],
  ) => {
    setEditValues((current) => ({
      ...current,
      [key]: value,
    }));
    editValuesRef.current = {
      ...editValuesRef.current,
      [key]: value,
    };
  };

  const saveEdit = async () => {
    if (!editingTarget) return;
    setSavingTargetId(editingTarget.id);
    setTargetMessage(null);
    try {
      const draft = editValuesRef.current;
      const updatedTarget = await updateDeploymentTarget(projectId, editingTarget.id, {
        ...draft,
        rootDirectory: draft.rootDirectory?.trim() || null,
        buildCommand: draft.buildCommand?.trim() || null,
        startCommand: draft.startCommand?.trim() || null,
        renderEnvironmentName: draft.renderEnvironmentName || null,
      });
      onTargetChanged(updatedTarget);
      setEditingTarget(null);
      setTargetMessage("Target metadata updated.");
    } catch {
      setTargetMessage("Unable to update target metadata.");
    } finally {
      setSavingTargetId(null);
    }
  };

  const runSync = async (target: DeploymentTarget) => {
    setSyncingTargetId(target.id);
    setTargetMessage(null);
    try {
      const response = await syncDeploymentTarget(projectId, target.id);
      onTargetChanged(response.target);
      setTargetMessage(
        response.findings.length
          ? `Local metadata sync completed with ${response.findings.length} finding${response.findings.length === 1 ? "" : "s"}.`
          : "Local metadata sync completed.",
      );
    } catch {
      setTargetMessage("Unable to sync target metadata.");
    } finally {
      setSyncingTargetId(null);
    }
  };

  const detachTarget = async (target: DeploymentTarget) => {
    if (detachConfirmTargetId !== target.id) {
      setDetachConfirmTargetId(target.id);
      setTargetMessage("Confirm detach to remove this target from AlphaCI only.");
      return;
    }

    setDetachingTargetId(target.id);
    setTargetMessage(null);
    try {
      await detachDeploymentTarget(projectId, target.id);
      onDetached(target.id);
      setDetachConfirmTargetId(null);
      setTargetMessage("Target detached from AlphaCI. Provider resource was not deleted.");
    } catch {
      setTargetMessage("Unable to detach deployment target.");
    } finally {
      setDetachingTargetId(null);
    }
  };

  return {
    detachConfirmTargetId,
    detachingTargetId,
    detachTarget,
    editValues,
    editingTarget,
    openEdit,
    runSync,
    saveEdit,
    savingTargetId,
    setEditingTarget,
    syncingTargetId,
    targetMessage,
    updateEditValue,
  };
}
