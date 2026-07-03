"use client";

import { motion } from "framer-motion";

import type { WorkflowHistoryItem } from "@/lib/api/contracts";
import { formatDate, toSourcePath } from "./workflow-builder-utils";

interface WorkflowHistoryPanelProps {
  history: WorkflowHistoryItem[];
  loadingHistory: boolean;
  onCopyYaml: (yaml: string) => void;
  onDownloadYaml: (yaml: string, fileName: string) => void;
  onOpenSetup: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
};

export function WorkflowHistoryPanel({
  history,
  loadingHistory,
  onCopyYaml,
  onDownloadYaml,
  onOpenSetup,
}: Readonly<WorkflowHistoryPanelProps>) {
  if (loadingHistory) {
    return (
      <div className="repo-grid">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton-card glass-panel"
            style={{ minHeight: "10rem", background: "rgba(15, 23, 42, 0.3)", animation: "state-pulse 1.5s infinite" }}
          />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "3rem 1.5rem", textAlign: "center", background: "rgba(15, 23, 42, 0.3)" }}>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 1.25rem", fontSize: "0.88rem" }}>
          No generated workflow history yet.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={onOpenSetup}
          style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", minHeight: "2.5rem" }}
        >
          Generate your first workflow
        </button>
      </div>
    );
  }

  return (
    <motion.div className="repo-grid" variants={containerVariants} initial="hidden" animate="show">
      {history.map((entry) => (
        <WorkflowHistoryCard
          key={entry.id}
          entry={entry}
          onCopyYaml={onCopyYaml}
          onDownloadYaml={onDownloadYaml}
          onOpenSetup={onOpenSetup}
        />
      ))}
    </motion.div>
  );
}

function WorkflowHistoryCard({
  entry,
  onCopyYaml,
  onDownloadYaml,
  onOpenSetup,
}: Readonly<{
  entry: WorkflowHistoryItem;
  onCopyYaml: (yaml: string) => void;
  onDownloadYaml: (yaml: string, fileName: string) => void;
  onOpenSetup: () => void;
}>) {
  return (
    <motion.article
      variants={cardVariants}
      className="repo-card glass-panel hud-glow-card"
      style={{
        background: "rgba(15, 23, 42, 0.45)",
        border: "1px solid var(--border-soft)",
        borderRadius: "1.25rem",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        transition: "all 0.25s ease",
      }}
      whileHover={{
        y: -3,
        borderColor: "rgba(56, 189, 248, 0.3)",
        boxShadow: "var(--shadow-card), 0 0 24px rgba(56, 189, 248, 0.05)",
      }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--gx", String((event.clientX - rect.left) / rect.width));
        event.currentTarget.style.setProperty("--gy", String((event.clientY - rect.top) / rect.height));
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.removeProperty("--gx");
        event.currentTarget.style.removeProperty("--gy");
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{entry.templateName}</h3>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>{formatDate(entry.createdAt)}</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {entry.stack ? (
          <span
            className="template-stack-badge"
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(56, 189, 248, 0.1)",
              color: "var(--brand)",
              border: "1px solid rgba(56, 189, 248, 0.15)",
            }}
          >
            {entry.stack}
          </span>
        ) : null}
        <span
          className="project-card-tag"
          style={{
            fontSize: "0.68rem",
            padding: "0.15rem 0.45rem",
            borderRadius: "4px",
            background: "rgba(255, 255, 255, 0.04)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-soft)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {entry.outputFileName}
        </span>
      </div>

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.45rem 1rem",
          background: "rgba(0,0,0,0.15)",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          fontSize: "0.78rem",
          margin: "0.1rem 0",
        }}
      >
        <dt style={{ color: "var(--text-muted)" }}>Service</dt>
        <dd style={{ color: "var(--text-primary)", fontWeight: 600 }}>{entry.serviceName}</dd>

        {entry.sourceWorkflowFile ? (
          <>
            <dt style={{ color: "var(--text-muted)" }}>Source</dt>
            <dd style={{ color: "var(--text-secondary)", fontFamily: "ui-monospace, monospace", fontSize: "0.72rem", wordBreak: "break-all" }}>
              {toSourcePath(entry.sourceWorkflowFile)}
            </dd>
          </>
        ) : null}
      </dl>

      <WorkflowHistoryActions
        entry={entry}
        onCopyYaml={onCopyYaml}
        onDownloadYaml={onDownloadYaml}
        onOpenSetup={onOpenSetup}
      />

      <details style={{ marginTop: "0.25rem" }}>
        <summary style={{ cursor: "pointer", color: "var(--brand)", fontWeight: 700, fontSize: "0.82rem", outline: "none", userSelect: "none" }}>
          Preview YAML config
        </summary>
        <pre
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid var(--border-soft)",
            borderRadius: "6px",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            overflowX: "auto",
            maxHeight: "150px",
          }}
        >
          {entry.yaml}
        </pre>
      </details>
    </motion.article>
  );
}

function WorkflowHistoryActions({
  entry,
  onCopyYaml,
  onDownloadYaml,
  onOpenSetup,
}: Readonly<{
  entry: WorkflowHistoryItem;
  onCopyYaml: (yaml: string) => void;
  onDownloadYaml: (yaml: string, fileName: string) => void;
  onOpenSetup: () => void;
}>) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginTop: "auto", borderTop: "1px solid var(--border-soft)", paddingTop: "0.75rem" }}>
      <button className="ghost-button" type="button" onClick={() => onCopyYaml(entry.yaml)} style={historyActionButtonStyle}>
        Copy YAML
      </button>
      <button className="ghost-button" type="button" onClick={() => onDownloadYaml(entry.yaml, entry.outputFileName)} style={historyActionButtonStyle}>
        Download
      </button>
      <button
        className="ghost-button"
        type="button"
        onClick={onOpenSetup}
        style={{ ...historyActionButtonStyle, marginLeft: "auto", border: "1px solid rgba(56, 189, 248, 0.2)", color: "var(--brand)", background: "rgba(56, 189, 248, 0.04)" }}
      >
        New
      </button>
    </div>
  );
}

const historyActionButtonStyle = {
  padding: "0.4rem 0.8rem",
  fontSize: "0.78rem",
  minHeight: "2rem",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
};
