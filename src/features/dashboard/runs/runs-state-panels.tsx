"use client";
import { feedbackStyles } from "@/components/ui/feedback-styles";
import { cn } from "@/lib/utils";

import { DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { FlowBackground } from "@/components/layout/flow-background";
import { Button, ButtonLink } from "@/components/ui/button";
import { layoutStyles } from "@/components/ui/layout-styles";

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

      <ButtonLink href="/workflows" variant="ghost">
        Connect a repository
      </ButtonLink>
    </div>
  );
}

export function RunsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className={cn("glass-panel", feedbackStyles.inlineError, feedbackStyles.inlineErrorGlass, "!mt-0 flex-wrap !gap-4 !rounded-[var(--radius-card)] !p-6")}
      role="alert"
    >
      <div className="flex flex-1 items-center gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p className="m-0 text-[0.85rem] text-[var(--text-secondary)]">{message}</p>
      </div>
      <Button type="button" onClick={onRetry} size="sm" variant="ghost">
        Retry
      </Button>
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
          {sessionError && <p className={cn(feedbackStyles.errorText, "text-[0.82rem]")}>{sessionError}</p>}
          <div className={layoutStyles.actionRow}>
            <Button type="button" onClick={onRetry}>Retry</Button>
            <ButtonLink variant="ghost" href="/login?next=/runs">Go to login</ButtonLink>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
