"use client";

import { useEffect, useRef, useState } from "react";

import {
  getProjectAuditEvents,
  getProjectCiRuns,
  getProjectDeployments,
  getProjectDrift,
  repairProjectDriftFinding,
  runProjectDriftDetection,
} from "@/lib/api/projects";
import type {
  ProjectAuditEventsResponse,
  ProjectCiRunsResponse,
  ProjectDeploymentsResponse,
  ProjectDriftRepairAction,
  ProjectDriftResponse,
  ProjectOverviewResponse,
  ProvisionedProject,
} from "@/lib/api/contracts";

type ProjectTelemetryTab = "overview" | "workflow" | "runs" | "deployments" | "environment" | "activity" | "audit" | "settings";

interface UseWorkflowProjectTelemetryOptions {
  ciRunTrackingEnabled: boolean;
  deploymentHistoryEnabled: boolean;
  driftDetectionEnabled: boolean;
  projectDetailTab: ProjectTelemetryTab;
  selectedOverview: ProjectOverviewResponse | null;
  selectedProject: ProvisionedProject | null;
}

export function useWorkflowProjectTelemetry({
  ciRunTrackingEnabled,
  deploymentHistoryEnabled,
  driftDetectionEnabled,
  projectDetailTab,
  selectedOverview,
  selectedProject,
}: Readonly<UseWorkflowProjectTelemetryOptions>) {
  const [ciRunsResponse, setCiRunsResponse] = useState<ProjectCiRunsResponse | null>(null);
  const [ciRunsProjectId, setCiRunsProjectId] = useState<string | null>(null);
  const [ciRunsError, setCiRunsError] = useState<string | null>(null);
  const [deploymentsResponse, setDeploymentsResponse] = useState<ProjectDeploymentsResponse | null>(null);
  const [deploymentsProjectId, setDeploymentsProjectId] = useState<string | null>(null);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
  const [driftResponse, setDriftResponse] = useState<ProjectDriftResponse | null>(null);
  const [driftProjectId, setDriftProjectId] = useState<string | null>(null);
  const [driftError, setDriftError] = useState<string | null>(null);
  const [runningDriftCheck, setRunningDriftCheck] = useState(false);
  const [auditResponse, setAuditResponse] = useState<ProjectAuditEventsResponse | null>(null);
  const [auditProjectId, setAuditProjectId] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const selectedProjectId = selectedProject?.id ?? null;
  const selectedProjectIdRef = useRef<string | null>(selectedProjectId);
  const driftRunRequestIdRef = useRef(0);

  selectedProjectIdRef.current = selectedProjectId;

  useEffect(() => {
    setRunningDriftCheck(false);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProject || projectDetailTab !== "audit") {
      return;
    }
    if (auditProjectId === selectedProject.id && (auditResponse || auditError)) {
      return;
    }

    let active = true;
    setAuditResponse(null);
    setAuditError(null);
    void getProjectAuditEvents(selectedProject.id)
      .then((response) => {
        if (active) {
          setAuditResponse(response);
          setAuditProjectId(selectedProject.id);
        }
      })
      .catch(() => {
        if (active) {
          setAuditProjectId(selectedProject.id);
          setAuditError("Unable to load audit events.");
        }
      });

    return () => {
      active = false;
    };
  }, [auditError, auditProjectId, auditResponse, projectDetailTab, selectedProject]);

  useEffect(() => {
    if (
      !selectedProject ||
      projectDetailTab !== "overview" ||
      !driftDetectionEnabled ||
      selectedOverview?.capabilities.driftDetection !== true
    ) {
      return;
    }

    if (driftProjectId === selectedProject.id && (driftResponse || driftError)) {
      return;
    }

    let active = true;
    setDriftResponse(null);
    setDriftError(null);
    void getProjectDrift(selectedProject.id)
      .then((response) => {
        if (active) {
          setDriftResponse(response);
          setDriftProjectId(selectedProject.id);
        }
      })
      .catch(() => {
        if (active) {
          setDriftProjectId(selectedProject.id);
          setDriftError("Unable to load drift findings.");
        }
      });

    return () => {
      active = false;
    };
  }, [
    driftDetectionEnabled,
    driftError,
    driftProjectId,
    driftResponse,
    projectDetailTab,
    selectedOverview,
    selectedProject,
  ]);

  useEffect(() => {
    if (
      !selectedProject ||
      projectDetailTab !== "deployments" ||
      !deploymentHistoryEnabled ||
      selectedOverview?.capabilities.deploymentHistory !== true
    ) {
      return;
    }

    if (deploymentsProjectId === selectedProject.id && (deploymentsResponse || deploymentsError)) {
      return;
    }

    let active = true;
    setDeploymentsResponse(null);
    setDeploymentsError(null);
    void getProjectDeployments(selectedProject.id)
      .then((response) => {
        if (active) {
          setDeploymentsResponse(response);
          setDeploymentsProjectId(selectedProject.id);
        }
      })
      .catch(() => {
        if (active) {
          setDeploymentsProjectId(selectedProject.id);
          setDeploymentsError("Unable to load deployment history.");
        }
      });

    return () => {
      active = false;
    };
  }, [
    deploymentHistoryEnabled,
    deploymentsError,
    deploymentsProjectId,
    deploymentsResponse,
    projectDetailTab,
    selectedOverview,
    selectedProject,
  ]);

  useEffect(() => {
    if (
      !selectedProject ||
      projectDetailTab !== "runs" ||
      !ciRunTrackingEnabled ||
      selectedOverview?.capabilities.ciRunTracking !== true
    ) {
      return;
    }

    if (ciRunsProjectId === selectedProject.id && (ciRunsResponse || ciRunsError)) {
      return;
    }

    let active = true;
    setCiRunsResponse(null);
    setCiRunsError(null);
    void getProjectCiRuns(selectedProject.id)
      .then((response) => {
        if (active) {
          setCiRunsResponse(response);
          setCiRunsProjectId(selectedProject.id);
        }
      })
      .catch(() => {
        if (active) {
          setCiRunsProjectId(selectedProject.id);
          setCiRunsError("Unable to load CI runs.");
        }
      });

    return () => {
      active = false;
    };
  }, [
    ciRunTrackingEnabled,
    ciRunsError,
    ciRunsProjectId,
    ciRunsResponse,
    projectDetailTab,
    selectedOverview,
    selectedProject,
  ]);

  async function handleRunDriftDetection() {
    const projectId = selectedProject?.id;
    if (!projectId) {
      return;
    }

    const requestId = driftRunRequestIdRef.current + 1;
    driftRunRequestIdRef.current = requestId;
    setRunningDriftCheck(true);
    setDriftProjectId(projectId);
    setDriftError(null);
    try {
      const response = await runProjectDriftDetection(projectId);
      if (selectedProjectIdRef.current !== projectId || driftRunRequestIdRef.current !== requestId) {
        return;
      }
      setDriftResponse(response);
    } catch {
      if (selectedProjectIdRef.current === projectId && driftRunRequestIdRef.current === requestId) {
        setDriftError("Unable to run drift detection.");
      }
    } finally {
      if (selectedProjectIdRef.current === projectId && driftRunRequestIdRef.current === requestId) {
        setRunningDriftCheck(false);
      }
    }
  }

  async function handleRepairDriftFinding(
    findingId: string,
    action: ProjectDriftRepairAction,
  ): Promise<string> {
    if (!selectedProject) {
      throw new Error("Project is not selected.");
    }

    const response = await repairProjectDriftFinding(
      selectedProject.id,
      findingId,
      action,
    );
    return response.message;
  }

  const scopedAuditResponse = auditProjectId === selectedProjectId ? auditResponse : null;
  const scopedAuditError = auditProjectId === selectedProjectId ? auditError : null;
  const scopedCiRunsResponse = ciRunsProjectId === selectedProjectId ? ciRunsResponse : null;
  const scopedCiRunsError = ciRunsProjectId === selectedProjectId ? ciRunsError : null;
  const scopedDeploymentsResponse = deploymentsProjectId === selectedProjectId ? deploymentsResponse : null;
  const scopedDeploymentsError = deploymentsProjectId === selectedProjectId ? deploymentsError : null;
  const scopedDriftResponse = driftProjectId === selectedProjectId ? driftResponse : null;
  const scopedDriftError = driftProjectId === selectedProjectId ? driftError : null;

  return {
    auditError: scopedAuditError,
    auditResponse: scopedAuditResponse,
    ciRunsError: scopedCiRunsError,
    ciRunsResponse: scopedCiRunsResponse,
    deploymentsError: scopedDeploymentsError,
    deploymentsResponse: scopedDeploymentsResponse,
    driftError: scopedDriftError,
    driftResponse: scopedDriftResponse,
    handleRepairDriftFinding,
    handleRunDriftDetection,
    runningDriftCheck,
  };
}
