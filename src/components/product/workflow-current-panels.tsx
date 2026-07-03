"use client";

import { useState } from "react";

import type {
  EnvVarMetadata,
  ProjectCiRunsResponse,
  ProjectDeploymentsResponse,
  ProjectDriftRepairAction,
  ProjectDriftResponse,
  WorkflowFileMetadata,
} from "@/lib/api/contracts";
import { formatDate } from "./workflow-builder-utils";

export function WorkflowStageList({ files }: Readonly<{ files?: WorkflowFileMetadata[] | null }>) {
  if (!files?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, fontWeight: 700 }}>
        {files.length} gated workflow stages
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {files.map((file) => (
          <div key={file.path} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.76rem", color: "var(--text-primary)", fontWeight: 700 }}>
              {file.name}
            </span>
            <code style={{ fontSize: "0.72rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              {file.path}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnvMetadataList({ metadata }: Readonly<{ metadata: EnvVarMetadata[] }>) {
  if (!metadata.length) {
    return <p className="env-empty-state">No variables provisioned yet.</p>;
  }

  return (
    <div className="env-metadata-list">
      {metadata.map((item) => (
        <div key={item.id} className={`env-metadata-row ${item.status}`}>
          <span>{item.key}</span>
          <span>
            {item.environment} - {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CiRunsList({ response }: Readonly<{ response: ProjectCiRunsResponse | null }>) {
  if (!response) {
    return <p className="env-empty-state">Loading CI runs...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {!response.liveGithubEnabled ? (
        <p className="env-empty-state" style={{ margin: 0 }}>
          Live GitHub run sync is not enabled
        </p>
      ) : null}
      {response.runs.length ? (
        <div className="env-metadata-list">
          {response.runs.map((run) => (
            <div key={run.id} className={`env-metadata-row ${run.conclusion === "failure" ? "failed" : "provisioned"}`}>
              <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <strong>{run.workflowName}</strong>
                <small>
                  {run.stage} - {run.branch} - {run.status}
                  {run.conclusion ? ` - ${run.conclusion}` : ""}
                </small>
                <small>
                  Commit {run.commitSha ?? "not available"} - Actor {run.actor}
                </small>
                <small>
                  {formatDate(run.createdAt)} - {formatDate(run.updatedAt)}
                </small>
              </span>
              <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <a className="ghost-button" href={run.htmlUrl} rel="noreferrer" target="_blank">
                  GitHub run
                </a>
                {run.canRerun ? (
                  <button className="ghost-button" type="button">
                    Rerun
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="env-empty-state">No CI runs tracked yet.</p>
      )}
    </div>
  );
}

export function DeploymentHistoryList({
  response,
}: Readonly<{ response: ProjectDeploymentsResponse | null }>) {
  if (!response) {
    return <p className="env-empty-state">Loading deployment history...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {!response.liveProvidersEnabled ? (
        <p className="env-empty-state" style={{ margin: 0 }}>
          Live deployment sync is not enabled
        </p>
      ) : null}
      {response.deployments.length ? (
        <div className="env-metadata-list">
          {response.deployments.map((deployment) => (
            <div
              key={deployment.id}
              className={`env-metadata-row ${
                deployment.status === "failed" ? "failed" : "provisioned"
              }`}
              style={{ alignItems: "flex-start" }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <strong>{deployment.targetName}</strong>
                <small>
                  {deployment.provider} - {deployment.environment ?? "environment not tracked"} - {deployment.status}
                </small>
                <small>
                  Branch {deployment.branch ?? "not available"} - Commit {deployment.commitSha ?? "not available"}
                </small>
                <small>
                  Created {formatDate(deployment.createdAt)} - Ready{" "}
                  {deployment.readyAt ? formatDate(deployment.readyAt) : "not ready"}
                </small>
              </span>
              <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <a className="ghost-button" href={deployment.providerUrl} rel="noreferrer" target="_blank">
                  Provider deployment
                </a>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="env-empty-state">No deployment history tracked yet.</p>
      )}
    </div>
  );
}

export function DriftFindingsPanel({
  onRun,
  onRepair,
  repairEnabled,
  response,
  running,
  workflowUpdatePrEnabled,
}: Readonly<{
  onRun: () => void;
  onRepair: (findingId: string, action: ProjectDriftRepairAction) => Promise<string>;
  repairEnabled: boolean;
  response: ProjectDriftResponse | null;
  running: boolean;
  workflowUpdatePrEnabled: boolean;
}>) {
  const [pendingRepair, setPendingRepair] = useState<{
    findingId: string;
    action: ProjectDriftRepairAction;
  } | null>(null);
  const [repairingFindingId, setRepairingFindingId] = useState<string | null>(null);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  if (!response) {
    return <p className="env-empty-state">Loading drift findings...</p>;
  }

  const actionForCode = (code: string): ProjectDriftRepairAction | null => {
    if (code === "ci_token_missing" || code === "ci_token_revoked") return "rotate_ci_token";
    if (code === "deployment_target_metadata_missing") return "detach_target";
    if (code === "workflow_files_missing" || code === "central_workflow_ref_outdated") {
      return workflowUpdatePrEnabled ? "create_workflow_update_pr" : "regenerate_workflow_preview";
    }
    return null;
  };
  const labelForAction = (action: ProjectDriftRepairAction) => {
    if (action === "rotate_ci_token") return "Rotate CI token";
    if (action === "detach_target") return "Detach target";
    if (action === "regenerate_workflow_preview") return "Preview workflow";
    if (action === "create_workflow_update_pr") return "Create update PR";
    return "Ignore finding";
  };

  return (
    <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Health findings</h4>
          <p className="env-empty-state" style={{ margin: "0.25rem 0 0" }}>
            Local snapshot
          </p>
        </div>
        <button
          className="ghost-button"
          type="button"
          disabled={running}
          onClick={onRun}
          style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
        >
          {running ? "Checking..." : "Run drift check"}
        </button>
      </div>
      {repairMessage ? <p className="env-empty-state" style={{ margin: 0 }}>{repairMessage}</p> : null}

      {response.findings.length ? (
        <div className="env-metadata-list">
          {response.findings.map((finding) => {
            const action = actionForCode(finding.code);
            const isConfirming =
              pendingRepair?.findingId === finding.id && pendingRepair.action === action;
            return (
              <div
                key={finding.id}
                className={`env-metadata-row ${finding.severity === "error" ? "failed" : "provisioned"}`}
                style={{ alignItems: "flex-start" }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <strong>{finding.code}</strong>
                  <small>
                    {finding.severity} - {finding.source} - {formatDate(finding.detectedAt)}
                  </small>
                  <small>{finding.message}</small>
                </span>
                {repairEnabled && action ? (
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={repairingFindingId === finding.id}
                    onClick={() => {
                      if (!isConfirming) {
                        setPendingRepair({ findingId: finding.id, action });
                        setRepairMessage("Confirm repair to run this local-safe action.");
                        return;
                      }
                      setRepairingFindingId(finding.id);
                      void onRepair(finding.id, action)
                        .then((message) => {
                          setRepairMessage(`${message}. Run drift check again to refresh findings.`);
                          setPendingRepair(null);
                        })
                        .catch(() => {
                          setRepairMessage("Unable to run repair action.");
                        })
                        .finally(() => setRepairingFindingId(null));
                    }}
                    style={{ minHeight: "2rem", padding: "0.35rem 0.7rem", fontSize: "0.76rem" }}
                  >
                    {repairingFindingId === finding.id
                      ? "Repairing..."
                      : isConfirming
                        ? "Confirm repair"
                        : labelForAction(action)}
                  </button>
                ) : action ? (
                  <button
                    className="ghost-button"
                    type="button"
                    disabled
                    title="Repair actions coming in the next phase"
                    style={{ minHeight: "2rem", padding: "0.35rem 0.7rem", fontSize: "0.76rem" }}
                  >
                    Repair actions coming in the next phase
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="env-empty-state">No active drift findings.</p>
      )}
    </div>
  );
}
