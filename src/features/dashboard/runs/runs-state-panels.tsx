"use client";

import Link from "next/link";

import { DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { FlowBackground } from "@/components/layout/flow-background";

export function RunsEmptyState() {
  return (
    <div
      className="glass-panel"
      style={{
        textAlign: "center",
        padding: "4rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "1rem",
        background: "rgba(56,189,248,0.08)",
        border: "1px solid var(--border-brand)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--brand)",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      <div style={{ maxWidth: "36ch" }}>
        <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 700, marginBottom: "0.5rem" }}>
          No pipeline runs yet
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
          Push a commit to a connected repository to see your pipeline results here. Each run shows exactly what passed, what failed, and how to fix it.
        </p>
      </div>

      <Link
        className="ghost-button"
        href="/workflows"
        style={{ padding: "0.5rem 1.4rem", fontSize: "0.88rem", minHeight: "2.4rem" }}
      >
        Connect a repository
      </Link>
    </div>
  );
}

export function RunsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="error-inline glass-panel"
      role="alert"
      style={{
        background: "rgba(248,113,113,0.05)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: "var(--radius-card)",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="ghost-button"
        style={{ padding: "0.35rem 1rem", fontSize: "0.82rem", minHeight: "2rem" }}
      >
        Retry
      </button>
    </div>
  );
}

export function RunsSessionErrorState({ sessionError, onRetry }: { sessionError?: string | null; onRetry: () => void }) {
  return (
    <DashboardShell suppressHydrationWarning={false}>
      <FlowBackground />
      <div className="state-body">
        <div className="state-card">
          <div className="state-icon" style={{ background: "rgba(255,79,79,0.08)", border: "1px solid rgba(255,79,79,0.2)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1>Session verification failed</h1>
          <p>We could not verify your session. Please retry or sign in again.</p>
          {sessionError && <p className="error-text" style={{ fontSize: "0.82rem" }}>{sessionError}</p>}
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onRetry}>Retry</button>
            <Link className="ghost-button" href="/login?next=/runs">Go to login</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
