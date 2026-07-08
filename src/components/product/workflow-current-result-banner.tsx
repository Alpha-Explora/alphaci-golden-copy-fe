import type { CreateProjectResult } from "@/lib/api/contracts";
import { DeploymentProvisioningSummary } from "./setup-result-panel";
import { WorkflowStageList } from "./workflow-current-panels";

export function WorkflowLatestResultBanner({ result }: Readonly<{ result: CreateProjectResult }>) {
  return (
    <div className="latest-result-banner glass-panel">
      <div className="latest-result-banner__header">
        <span className="latest-result-banner__dot" aria-hidden="true" />
        <p className="eyebrow latest-result-banner__eyebrow">Project Created Successfully</p>
        <span className="latest-result-banner__sep" aria-hidden="true">·</span>
        <span className="latest-result-banner__repo">{result.repoFullName}</span>
      </div>

      <div className="flex flex-wrap gap-[0.35rem] latest-result-banner__chips">
        <span className="branch-chip">{result.status}</span>
        <span className="branch-chip">{result.projectTypeId}</span>
        <span className="branch-chip">{result.workflowRecipeId}</span>
        {result.branchesCreated.map((branch) => (
          <span key={branch} className="branch-chip branch-chip--mono">{branch}</span>
        ))}
      </div>

      <p className="latest-result-banner__meta">
        Workflow file:{" "}
        <strong className="latest-result-banner__filename">{result.outputFileName}</strong>
        {result.githubCommitUrl ? (
          <a
            href={result.githubCommitUrl}
            target="_blank"
            rel="noreferrer"
            className="latest-result-banner__commit-link"
          >
            commit: <span className="latest-result-banner__sha">{result.githubCommitSha.slice(0, 10)}</span>
          </a>
        ) : (
          <code className="latest-result-banner__sha-plain">{result.githubCommitSha.slice(0, 10)}</code>
        )}
      </p>

      <WorkflowStageList files={result.workflowFiles} />
      <DeploymentProvisioningSummary result={result.deploymentProvisioning} />

      <div className="latest-result-banner__actions">
        <a className="latest-result-banner__action-btn latest-result-banner__action-btn--primary" href={result.repoUrl} target="_blank" rel="noreferrer">
          Open Repository
        </a>
        <a className="latest-result-banner__action-btn" href={`${result.repoUrl}/actions`} target="_blank" rel="noreferrer">
          Open Actions
        </a>
        <a
          className="latest-result-banner__action-btn"
          href={`${result.repoUrl}/blob/main/${result.workflowPath}`}
          target="_blank"
          rel="noreferrer"
        >
          View Workflow File
        </a>
      </div>

      <p className="latest-result-banner__footer">
        Workflow committed to{" "}
        <code className="file-path-label">{result.workflowPath}</code>{" "}
        on <code className="file-path-label">main</code>.
        Push to <code className="file-path-label">test</code> to trigger your first CI run.
      </p>
    </div>
  );
}
