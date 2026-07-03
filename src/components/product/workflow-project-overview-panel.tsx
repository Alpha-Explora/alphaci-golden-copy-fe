"use client";

import type {
  ProjectDriftRepairAction,
  ProjectDriftResponse,
  ProjectOverviewResponse,
  ProvisionedProject,
  WorkflowFileMetadata,
} from "@/lib/api/contracts";
import { selectedChecks } from "./workflow-current-formatters";
import { DriftFindingsPanel } from "./workflow-current-panels";
import { formatDate } from "./workflow-builder-utils";

export function WorkflowProjectOverviewPanel({
  driftDetectionEnabled,
  driftError,
  driftRepairEnabled,
  driftResponse,
  onProjectSync,
  onRepairDriftFinding,
  onRunDriftDetection,
  project,
  runningDriftCheck,
  selectedOverview,
  selectedWorkflowFiles,
  syncAvailable,
  syncMessage,
  syncingProjectId,
  syncSnapshot,
  workflowUpdatePrEnabled,
}: Readonly<{
  driftDetectionEnabled: boolean;
  driftError: string | null;
  driftRepairEnabled: boolean;
  driftResponse: ProjectDriftResponse | null;
  onProjectSync: () => void | Promise<void>;
  onRepairDriftFinding: (findingId: string, action: ProjectDriftRepairAction) => Promise<string>;
  onRunDriftDetection: () => void;
  project: ProvisionedProject;
  runningDriftCheck: boolean;
  selectedOverview: ProjectOverviewResponse | null;
  selectedWorkflowFiles: WorkflowFileMetadata[];
  syncAvailable: boolean;
  syncMessage: string | null;
  syncingProjectId: string | null;
  syncSnapshot: ProjectOverviewResponse["syncSnapshot"] | null;
  workflowUpdatePrEnabled: boolean;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <dl className="project-detail-grid">
        <div>
          <dt>Workflow</dt>
          <dd>{selectedOverview?.workflow.path ?? project.workflowPath}</dd>
        </div>
        <div>
          <dt>Checks</dt>
          <dd>{selectedChecks(project)}</dd>
        </div>
        {project.githubCommitSha ? (
          <div>
            <dt>Commit</dt>
            <dd>{project.githubCommitSha.slice(0, 10)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Stages</dt>
          <dd>{selectedWorkflowFiles.length ? `${selectedWorkflowFiles.length} gated workflow stages` : "Not configured"}</dd>
        </div>
        <div>
          <dt>CI token</dt>
          <dd>{selectedOverview?.ciAuth.status ?? "Not loaded"}</dd>
        </div>
        <div>
          <dt>Targets</dt>
          <dd>{selectedOverview ? selectedOverview.deploymentTargets.count : "Not loaded"}</dd>
        </div>
      </dl>

      {syncSnapshot ? (
        <div className="env-metadata-row provisioned" style={{ alignItems: "center" }}>
          <span>
            <strong>Local snapshot</strong>
            <br />
            {syncSnapshot.latest
              ? `${syncSnapshot.latest.status} - ${syncSnapshot.latest.findings.length} finding${syncSnapshot.latest.findings.length === 1 ? "" : "s"} - ${formatDate(syncSnapshot.latest.completedAt)}`
              : "Not synced yet"}
          </span>
          {syncAvailable ? (
            <button
              className="ghost-button target-action-btn"
              type="button"
              disabled={syncingProjectId === project.id}
              onClick={() => void onProjectSync()}
            >
              {syncingProjectId === project.id ? "Syncing…" : "Sync now"}
            </button>
          ) : null}
        </div>
      ) : null}

      {syncMessage ? (
        <p className="error-text" style={{ margin: 0 }}>{syncMessage}</p>
      ) : null}

      {project.failureReason ? (
        <p className="error-text" style={{ margin: 0 }}>
          {project.failureReason}
        </p>
      ) : null}

      {selectedOverview?.health.checks.length ? (
        <div className="env-metadata-list" data-tour="sync-health">
          {selectedOverview.health.checks.map((check) => (
            <div key={check.key} className={`env-metadata-row ${check.status === "error" ? "failed" : "provisioned"}`}>
              <span>{check.label}</span>
              <span>{check.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      {driftDetectionEnabled && selectedOverview?.capabilities.driftDetection ? (
        driftError ? (
          <p className="error-text" style={{ margin: 0 }}>{driftError}</p>
        ) : (
          <DriftFindingsPanel
            onRun={onRunDriftDetection}
            onRepair={onRepairDriftFinding}
            repairEnabled={driftRepairEnabled}
            response={driftResponse}
            running={runningDriftCheck}
            workflowUpdatePrEnabled={workflowUpdatePrEnabled}
          />
        )
      ) : null}
    </div>
  );
}
