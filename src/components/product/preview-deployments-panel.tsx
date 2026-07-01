"use client";

export interface PreviewDeployment {
  id: string;
  previewUrl: string;
  repositoryFullName: string;
  pullRequestNumber: number;
  sourceBranch: string;
  commitSha: string;
  lifecycleStatus:
    | "requested"
    | "building"
    | "deploying"
    | "healthy"
    | "unhealthy"
    | "expired"
    | "cleanup_required"
    | "deleting"
    | "deleted"
    | "failed";
  cleanupStatus: "none" | "pending" | "cleanup_required" | "deleting" | "deleted" | "failed";
  expiresAt: string;
  safeMessage: string | null;
}

interface PreviewDeploymentsPanelProps {
  previews: PreviewDeployment[];
  onRequestCleanup?: (preview: PreviewDeployment) => void;
}

function lifecycleLabel(status: PreviewDeployment["lifecycleStatus"]): string {
  const labels: Record<PreviewDeployment["lifecycleStatus"], string> = {
    requested: "Requested",
    building: "Building",
    deploying: "Deploying",
    healthy: "Healthy",
    unhealthy: "Unhealthy",
    expired: "Expired",
    cleanup_required: "Cleanup required",
    deleting: "Deleting",
    deleted: "Deleted",
    failed: "Failed",
  };

  return labels[status];
}

function cleanupLabel(status: PreviewDeployment["cleanupStatus"]): string {
  const labels: Record<PreviewDeployment["cleanupStatus"], string> = {
    none: "Cleanup not required",
    pending: "Cleanup pending",
    cleanup_required: "Cleanup required",
    deleting: "Deleting",
    deleted: "Deleted",
    failed: "Cleanup failed",
  };

  return labels[status];
}

export function PreviewDeploymentsPanel({
  previews,
  onRequestCleanup,
}: Readonly<PreviewDeploymentsPanelProps>) {
  return (
    <section className="preview-deployments-panel" aria-labelledby="preview-deployments-title">
      <div className="panel-heading-row">
        <div>
          <h3 id="preview-deployments-title">Preview Deployments</h3>
          <p className="muted">Pull request previews use isolated Cloud Run services with cleanup tracking.</p>
        </div>
      </div>

      {previews.length ? (
        <ul className="preview-list">
          {previews.map((preview) => (
            <li key={preview.id}>
              <div>
                <strong>{preview.previewUrl}</strong>
                <p className="muted">{preview.repositoryFullName} #{preview.pullRequestNumber}</p>
                <p className="muted">{preview.sourceBranch}</p>
                <p className="muted">{preview.commitSha.slice(0, 7)}</p>
                <p className="muted">Expires {preview.expiresAt.slice(0, 10)}</p>
                {preview.safeMessage ? <p>{preview.safeMessage}</p> : null}
              </div>
              <span>{lifecycleLabel(preview.lifecycleStatus)}</span>
              <span>{cleanupLabel(preview.cleanupStatus)}</span>
              <button
                type="button"
                onClick={() => onRequestCleanup?.(preview)}
                disabled={!onRequestCleanup || preview.cleanupStatus === "deleted"}
              >
                Cleanup
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No preview deployments have been created.</p>
      )}
    </section>
  );
}
