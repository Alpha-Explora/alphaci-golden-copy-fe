"use client";

import type { Dispatch, SetStateAction } from "react";

import type {
  DeploymentTarget,
  WorkflowFileMetadata,
  WorkflowSettings,
  WorkflowSettingsPreviewResponse,
  WorkflowUpdatePullRequestResponse,
} from "@/lib/api/contracts";
import { HelpTip } from "./help-tip";
import { WorkflowStageList } from "./workflow-current-panels";

export function WorkflowProjectWorkflowPanel({
  creatingWorkflowPr,
  deploymentTargets,
  onCreateWorkflowPr,
  onWorkflowPreview,
  previewingWorkflow,
  selectedWorkflowFiles,
  setWorkflowSettings,
  workflowPreview,
  workflowSettings,
  workflowSettingsCapable,
  workflowSettingsError,
  workflowSettingsPreviewEnabled,
  workflowUpdatePr,
  workflowUpdatePrEnabled,
  workflowUpdatePrError,
}: Readonly<{
  creatingWorkflowPr: boolean;
  deploymentTargets: DeploymentTarget[];
  onCreateWorkflowPr: () => void | Promise<void>;
  onWorkflowPreview: () => void | Promise<void>;
  previewingWorkflow: boolean;
  selectedWorkflowFiles: WorkflowFileMetadata[];
  setWorkflowSettings: Dispatch<SetStateAction<WorkflowSettings | null>>;
  workflowPreview: WorkflowSettingsPreviewResponse | null;
  workflowSettings: WorkflowSettings | null;
  workflowSettingsCapable: boolean;
  workflowSettingsError: string | null;
  workflowSettingsPreviewEnabled: boolean;
  workflowUpdatePr: WorkflowUpdatePullRequestResponse | null;
  workflowUpdatePrEnabled: boolean;
  workflowUpdatePrError: string | null;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {workflowSettingsPreviewEnabled && workflowSettingsCapable ? (
        <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Workflow settings</h4>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                Preview only
              </p>
            </div>
            <button
              className="ghost-button"
              type="button"
              disabled={!workflowSettings || previewingWorkflow}
              onClick={() => void onWorkflowPreview()}
              style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
            >
              {previewingWorkflow ? "Previewing..." : "Preview"}
            </button>
          </div>

          {workflowSettings ? (
            <div className="project-detail-grid">
              <label>
                <dt>Node version</dt>
                <input
                  aria-label="Node version"
                  value={workflowSettings.nodeVersion}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      nodeVersion: event.target.value,
                    });
                  }}
                />
              </label>
              <label>
                <dt>
                  Coverage threshold
                  <HelpTip text="The minimum percentage of code that unit tests must exercise. Pipeline runs fail the Quality stage if coverage drops below this number." />
                </dt>
                <input
                  aria-label="Coverage threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={workflowSettings.coverageThreshold}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      coverageThreshold: Number(event.target.value),
                    });
                  }}
                />
              </label>
              <label>
                <dt>
                  Service path
                  <HelpTip text="The folder inside the repository where this service's code lives. Used to scope which files trigger this workflow and where build commands run." />
                </dt>
                <input
                  aria-label="Service path"
                  value={workflowSettings.servicePath}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      servicePath: event.target.value,
                    });
                  }}
                />
              </label>
              <label>
                <dt>
                  Central workflow ref
                  <HelpTip text="The branch or tag of ImplementSprint/central-workflow that this project's pipeline is pinned to. It supplies the reusable gated-stage logic — Access, Quality, Package — that every generated workflow calls into." />
                </dt>
                <input
                  aria-label="Central workflow ref"
                  value={workflowSettings.centralWorkflowRef}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      centralWorkflowRef: event.target.value,
                    });
                  }}
                />
              </label>
              <label>
                <dt>Workflow recipe</dt>
                <input
                  aria-label="Workflow recipe"
                  value={workflowSettings.workflowRecipeId ?? ""}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      workflowRecipeId: event.target.value || null,
                    });
                  }}
                />
              </label>
              <label>
                <dt>Package manager</dt>
                <select aria-label="Package manager" value={workflowSettings.packageManager} disabled>
                  <option value="npm">npm</option>
                </select>
              </label>
              <label>
                <dt>Lint</dt>
                <input
                  aria-label="Lint"
                  type="checkbox"
                  checked={workflowSettings.checks.lint}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      checks: {
                        ...workflowSettings.checks,
                        lint: event.target.checked,
                      },
                    });
                  }}
                />
              </label>
              <label>
                <dt>Unit tests</dt>
                <input
                  aria-label="Unit tests"
                  type="checkbox"
                  checked={workflowSettings.checks.unit}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      checks: {
                        ...workflowSettings.checks,
                        unit: event.target.checked,
                      },
                    });
                  }}
                />
              </label>
              <label>
                <dt>Build</dt>
                <input
                  aria-label="Build"
                  type="checkbox"
                  checked={workflowSettings.checks.build}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      checks: {
                        ...workflowSettings.checks,
                        build: event.target.checked,
                      },
                    });
                  }}
                />
              </label>
              <label>
                <dt>Security</dt>
                <input
                  aria-label="Security"
                  type="checkbox"
                  checked={workflowSettings.checks.security}
                  onChange={(event) => {
                    setWorkflowSettings({
                      ...workflowSettings,
                      checks: {
                        ...workflowSettings.checks,
                        security: event.target.checked,
                      },
                    });
                  }}
                />
              </label>
            </div>
          ) : (
            <p className="env-empty-state">Loading workflow settings...</p>
          )}

          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem" }}>Deploy target mappings</h4>
            {deploymentTargets.length ? (
              <div className="env-metadata-list">
                {deploymentTargets.map((target) => (
                  <div key={target.id} className="env-metadata-row provisioned">
                    <span>{target.slot}</span>
                    <span>{target.providerProjectName} / {target.branchName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="env-empty-state">No deployment target mappings.</p>
            )}
          </div>

          {workflowSettingsError ? (
            <p className="error-text" style={{ margin: 0 }}>{workflowSettingsError}</p>
          ) : null}

          {workflowPreview?.validationWarnings.length ? (
            <div className="env-metadata-list">
              {workflowPreview.validationWarnings.map((warning) => (
                <div key={`${warning.field}-${warning.message}`} className="env-metadata-row failed">
                  <span>{warning.field}</span>
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          ) : null}

          {workflowPreview ? (
            <>
              <div className="env-metadata-list">
                {workflowPreview.diffSummary.map((item) => (
                  <div key={item.path} className="env-metadata-row provisioned">
                    <span>{item.path}</span>
                    <span className={item.status === "changed" ? "dash-badge-violet" : "branch-chip"}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              {workflowUpdatePrEnabled ? (
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={creatingWorkflowPr}
                    onClick={() => void onCreateWorkflowPr()}
                    style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                  >
                    {creatingWorkflowPr ? "Creating..." : "Create update PR"}
                  </button>
                  {workflowUpdatePr ? (
                    <a
                      className="ghost-button"
                      href={workflowUpdatePr.pullRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                    >
                      {workflowUpdatePr.pullRequestUrl}
                    </a>
                  ) : null}
                </div>
              ) : null}
              {workflowUpdatePrError ? (
                <p className="error-text" style={{ margin: 0 }}>{workflowUpdatePrError}</p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {selectedWorkflowFiles.length ? (
        <WorkflowStageList files={selectedWorkflowFiles} />
      ) : (
        <p className="env-empty-state">No workflow file metadata is tracked yet.</p>
      )}
    </div>
  );
}
