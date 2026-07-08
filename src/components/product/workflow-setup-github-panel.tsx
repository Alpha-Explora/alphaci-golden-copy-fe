import { Button } from "@/components/ui/button";

import { workflowSetupGithubPanelStyles as styles } from "./workflow-setup-github-panel.styles";
import { setupInputLabelClasses, setupLabelAccentStyle } from "./workflow-setup-utils";

interface WorkflowSetupGithubPanelProps {
  github: {
    handleLinkInstallation: () => void | Promise<void>;
    installationAccounts: Array<{
      accountLogin?: string | null;
      installationId: number;
      repositorySelection: string;
    }>;
    installationId: string;
    installationStatusCopy: string;
    installUrl: string | null;
    linkedRepos: Array<{ repoFullName: string }>;
    linkingInstallation: boolean;
    loadingInstallUrl: boolean;
    setInstallationId: (value: string) => void;
  };
}

export function WorkflowSetupGithubPanel({ github }: Readonly<WorkflowSetupGithubPanelProps>) {
  return (
    <div>
      <span className="cp-section-heading">GitHub App</span>
      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
        {github.installationStatusCopy}
      </p>

      {github.installationAccounts.length > 0 ? (
        <div style={{ display: "grid", gap: "0.35rem", marginBottom: "0.65rem" }}>
          {github.installationAccounts.map((account) => (
            <div
              key={account.installationId}
              style={{
                borderLeft: "2px solid var(--border-brand)",
                paddingLeft: "0.6rem",
                color: "var(--text-secondary)",
                fontSize: "0.76rem",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>
                {account.accountLogin ? `@${account.accountLogin}` : `Installation ${account.installationId}`}
              </strong>
              <span style={{ color: "var(--text-muted)" }}>
                {" "}· {account.repositorySelection} repos
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {github.linkedRepos.length > 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.74rem", margin: "0 0 0.65rem", lineHeight: 1.45 }}>
          {github.linkedRepos.slice(0, 3).map((r) => r.repoFullName).join(", ")}
          {github.linkedRepos.length > 3 ? ` +${github.linkedRepos.length - 3} more` : ""}
        </p>
      ) : null}

      {github.installUrl ? (
        <a
          href={github.installUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.85rem",
            border: "1px solid var(--border-strong)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            borderRadius: "6px",
            textDecoration: "none",
            marginBottom: "0.65rem",
            fontWeight: 600,
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          Install GitHub App
        </a>
      ) : (
        <button
          type="button"
          disabled
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem 0.85rem",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            borderRadius: "6px",
            textAlign: "center",
            cursor: "not-allowed",
            marginBottom: "0.65rem",
          }}
        >
          {github.loadingInstallUrl ? "Loading install link…" : "Install link unavailable"}
        </button>
      )}

      <details>
        <summary style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          cursor: "pointer",
          userSelect: "none",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}>
          <span style={{ fontSize: "0.65rem" }}>&#9654;</span>
          Already installed? Link by ID
        </summary>
        <div style={{ marginTop: "0.65rem" }}>
          <label className={`${setupInputLabelClasses} ${styles.compactLabel}`} htmlFor="installation-id" style={setupLabelAccentStyle}>
            Installation ID
          </label>
          <input
            id="installation-id"
            value={github.installationId}
            onChange={(event) => github.setInstallationId(event.target.value.replaceAll(/\D/g, ""))}
            placeholder="12345678"
            className="premium-input"
          />
          <Button
            type="button"
            variant="ghost"
            className={styles.linkButton}
            onClick={() => void github.handleLinkInstallation()}
            disabled={github.linkingInstallation}
          >
            {github.linkingInstallation ? "Linking…" : "Link installation"}
          </Button>
        </div>
      </details>
    </div>
  );
}
