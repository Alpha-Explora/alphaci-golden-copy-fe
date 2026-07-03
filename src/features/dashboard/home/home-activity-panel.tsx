"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import type { WorkflowHistoryItem } from "@/lib/api/contracts";

import { EASE_OUT } from "./home-bento-grid";

interface HomeActivityPanelProps {
  history: WorkflowHistoryItem[];
  historyError: string | null;
  historyLoading: boolean;
  loadHistory: () => void;
  prefersReducedMotion: boolean | null;
}

export function HomeActivityPanel({
  history,
  historyError,
  historyLoading,
  loadHistory,
  prefersReducedMotion,
}: Readonly<HomeActivityPanelProps>) {
  return (
    <motion.div
      key="activity"
      id="dash-panel-activity"
      role="tabpanel"
      aria-labelledby="dash-tab-activity"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
    >
      <section aria-label="Recent workflows">
        <div className="dash-section-label">
          <div className="dash-section-label-left">
            <p className="file-path-label" style={{ marginBottom: 0, color: "var(--brand)" }}>workflows/recent.yml</p>
            {!historyLoading && history.length > 0 && (
              <span className="dash-count-chip">{history.length} generated workflows</span>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="repo-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card glass-panel" style={{ minHeight: "8rem", background: "rgba(15, 23, 42, 0.3)", animation: "state-pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : historyError ? (
          <div className="error-inline glass-panel" role="alert" style={{ background: "rgba(248, 113, 113, 0.05)" }}>
            <span className="error-inline-icon" aria-hidden="true">!</span>
            <p className="error-inline-msg">{historyError}</p>
            <button className="error-retry-btn" type="button" onClick={loadHistory}>Retry</button>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(15, 23, 42, 0.3)" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>No workflow history yet.</p>
            <Link className="primary-button" href="/workflows" style={{ padding: "0.65rem 1.5rem", fontSize: "0.9rem" }}>Create your first project</Link>
          </div>
        ) : (
          <div className="repo-grid">
            {history.map((item) => (
              <article key={item.id} className="repo-card glass-panel repo-card-brand">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Badge tone="info" dot>{item.stack}</Badge>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {new Intl.DateTimeFormat("en-PH", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}
                  </span>
                </div>

                <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 700 }}>{item.serviceName}</h3>

                <div className="activity-code-block">
                  <span className="activity-code-label">Workflow File</span>
                  <span className="activity-code-value">{item.outputFileName}</span>
                </div>

                <div className="repo-card-meta">
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                    Actions config built
                  </span>
                  <Link href="/workflows" style={{ fontSize: "0.7rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    View Studio
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
