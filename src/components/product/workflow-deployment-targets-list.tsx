"use client";

import type {
  DeploymentTarget,
  EnvEnvironment,
  EnvTargetSlot,
} from "@/lib/api/contracts";
import { useWorkflowDeploymentTargets } from "./use-workflow-deployment-targets";

function providerDashboardUrl(target: DeploymentTarget): string | null {
  if (target.provider === "vercel") {
    const teamSlug =
      typeof target.providerMetadata?.vercelTeamSlug === "string"
        ? target.providerMetadata.vercelTeamSlug.trim()
        : "";
    return teamSlug
      ? `https://vercel.com/${teamSlug}/${target.providerProjectName}`
      : `https://vercel.com/dashboard/project/${target.providerProjectId}`;
  }

  if (target.provider === "render") {
    return `https://dashboard.render.com/web/${target.providerProjectId}`;
  }

  return null;
}

export function DeploymentTargetsList({
  managementEnabled,
  onDetached,
  onTargetChanged,
  projectId,
  targets,
}: Readonly<{
  managementEnabled: boolean;
  onDetached: (targetId: string) => void;
  onTargetChanged: (target: DeploymentTarget) => void;
  projectId: string;
  targets: DeploymentTarget[];
}>) {
  const {
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
  } = useWorkflowDeploymentTargets({ onDetached, onTargetChanged, projectId });

  if (!targets.length) {
    return <p className="env-empty-state">No deployment targets configured.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {targetMessage ? <p className="env-empty-state">{targetMessage}</p> : null}
      <div className="env-metadata-list" data-tour="deployment-targets">
        {targets.map((target) => {
          const dashboardUrl = providerDashboardUrl(target);
          const isDetachConfirm = detachConfirmTargetId === target.id;
          return (
            <div key={target.id} className={`env-metadata-row ${target.status}`} style={{ alignItems: "flex-start" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <strong>{target.providerProjectName}</strong>
                <small>
                  {target.provider} · {target.slot} · {target.branchName}
                </small>
                <small style={{ color: "var(--text-muted)" }}>
                  Root: {target.rootDirectory || "."} · Build: {target.buildCommand || "—"} · Start:{" "}
                  {target.startCommand || "—"}
                </small>
                {target.renderEnvironmentName ? (
                  <small style={{ color: "var(--text-muted)" }}>Render env: {target.renderEnvironmentName}</small>
                ) : null}
                <small style={{ color: "var(--text-muted)" }}>ID: {target.providerProjectId}</small>
              </span>

              <div className="target-actions">
                <div className="target-actions-primary">
                  <button
                    className="ghost-button target-action-btn"
                    type="button"
                    disabled={!managementEnabled}
                    onClick={() => openEdit(target)}
                  >
                    Edit
                  </button>
                  <button
                    className="ghost-button target-action-btn"
                    type="button"
                    disabled={!managementEnabled || syncingTargetId === target.id}
                    onClick={() => void runSync(target)}
                  >
                    {syncingTargetId === target.id ? "Syncing…" : "Sync"}
                  </button>
                </div>

                {dashboardUrl ? (
                  <div className="target-actions-secondary">
                    <a
                      className="ghost-button target-action-btn"
                      href={dashboardUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Provider dashboard ↗
                    </a>
                  </div>
                ) : null}

                <span className="target-upcoming-hint" title="Provider activation will be available in the next phase">
                  Provider activation — coming soon
                </span>

                <div className="target-actions-destructive">
                  <button
                    className={`ghost-button target-action-btn ${isDetachConfirm ? "target-action-btn--confirm" : "target-action-btn--detach"}`}
                    type="button"
                    disabled={!managementEnabled || detachingTargetId === target.id}
                    onClick={() => void detachTarget(target)}
                  >
                    {detachingTargetId === target.id
                      ? "Detaching…"
                      : isDetachConfirm
                        ? "Confirm detach"
                        : "Detach"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editingTarget ? (
        <div className="env-card" data-testid="target-edit-drawer" style={{ gap: "0.85rem" }}>
          <div>
            <h4 style={{ margin: 0 }}>Edit deployment target</h4>
            <p className="env-empty-state" style={{ margin: "0.25rem 0 0" }}>
              Metadata edits only. Provider resources and secrets are unchanged.
            </p>
          </div>
          <div className="env-form-grid">
            <label>
              Display name
              <input
                aria-label="Target display name"
                value={editValues.providerProjectName ?? ""}
                onChange={(event) => updateEditValue("providerProjectName", event.target.value)}
              />
            </label>
            <label>
              Slot
              <select
                aria-label="Target slot"
                value={editValues.slot ?? "backend"}
                onChange={(event) => updateEditValue("slot", event.target.value as EnvTargetSlot)}
              >
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
                <option value="standalone">Standalone</option>
              </select>
            </label>
            <label>
              Branch
              <input
                aria-label="Target branch"
                value={editValues.branchName ?? ""}
                onChange={(event) => updateEditValue("branchName", event.target.value)}
              />
            </label>
            <label>
              Root directory
              <input
                aria-label="Target root directory"
                value={editValues.rootDirectory ?? ""}
                onChange={(event) => updateEditValue("rootDirectory", event.target.value)}
              />
            </label>
            <label>
              Build command
              <input
                aria-label="Target build command"
                value={editValues.buildCommand ?? ""}
                onChange={(event) => updateEditValue("buildCommand", event.target.value)}
              />
            </label>
            <label>
              Start command
              <input
                aria-label="Target start command"
                value={editValues.startCommand ?? ""}
                onChange={(event) => updateEditValue("startCommand", event.target.value)}
              />
            </label>
            {editingTarget.provider === "render" ? (
              <label>
                Provider environment
                <select
                  aria-label="Target provider environment"
                  value={editValues.renderEnvironmentName ?? ""}
                  onChange={(event) => updateEditValue("renderEnvironmentName", event.target.value as EnvEnvironment)}
                >
                  <option value="">Not configured</option>
                  <option value="test">Test</option>
                  <option value="uat">UAT</option>
                  <option value="production">Production</option>
                </select>
              </label>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="ghost-button" type="button" onClick={() => setEditingTarget(null)}>
              Cancel
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={savingTargetId === editingTarget.id}
              onClick={() => void saveEdit()}
            >
              {savingTargetId === editingTarget.id ? "Saving..." : "Save metadata"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
