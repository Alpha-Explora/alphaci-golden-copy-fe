"use client";
import { productSharedStyles } from "@/components/product/product-shared-styles";
import { feedbackStyles } from "@/components/ui/feedback-styles";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { AppNav } from "@/components/layout/app-nav";
import { FlowBackground } from "@/components/layout/flow-background";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { layoutStyles } from "@/components/ui/layout-styles";
import { WorkspaceProvider } from "@/components/layout/workspace-context";
import { WorkflowBuilder } from "../../components/product/workflow-builder";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/api/client";
import { isGuest } from "@/lib/auth/subscription";
import { cn } from "@/lib/utils";

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function WorkflowsPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { status, session, error, refresh } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut]   = useState(false);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutMessage(null);
    try {
      await logout();
      await refresh();
      router.push("/");
    } catch {
      setLogoutMessage("Sign out failed. Please retry, or use the Home link.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  /* ── Guard: loading ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/signup");
    }
  }, [router, status]);
  if (status === "loading") {
    return <PipelineLoader label="Loading Workflow Studio" />;
  }

  if (status === "signed-out") {
    return <PipelineLoader label="Redirecting to sign up" />;
  }

  /* ── Guard: error ───────────────────────────────────────────────────────── */
  if (status === "error") {
    return (
      <main className="max-[640px]:overflow-x-hidden">
        <FlowBackground />
        <div className="state-body">
          <div className="state-card">
            <div className="state-icon" style={{ background: "rgba(255,79,79,0.08)", border: "1px solid rgba(255,79,79,0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h1>Session verification failed</h1>
            <p>We could not verify your workflow access. Retry or sign in again.</p>
            <div className={layoutStyles.actionRow}>
              <button className="primary-button" type="button" onClick={() => void refresh()}>
                Retry
              </button>
              <Link className="ghost-button" href="/login?next=/workflows">Go to login</Link>
            </div>
            {error ? <p className={cn(feedbackStyles.errorText, "text-[0.82rem]")}>{error}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  /* ── Signed-in app ─────────────────────────────────────────── */
  const guest = isGuest(session);

  return (
    <WorkspaceProvider>
    <main className="max-[640px]:overflow-x-hidden" suppressHydrationWarning>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FlowBackground />

      <AppNav
        guest={guest}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />

      {guest && (
        <div className={productSharedStyles.guestBanner} role="alert">
          <p className={productSharedStyles.guestBannerText}>
            Sign up to unlock AlphaCI.
          </p>
          <div className={productSharedStyles.guestBannerActions}>
            <Link className="primary-button" href="/signup" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
              Sign up free
            </Link>
            <Link className="ghost-button" href="/login" style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem" }}>
              Log in
            </Link>
          </div>
        </div>
      )}

      {logoutMessage ? <p className={feedbackStyles.errorText}>{logoutMessage}</p> : null}

      <div id="main-content" style={{ padding: 0 }}>
        {/* Page header — compact single band: breadcrumb + title + studio badge inline */}
        <motion.div
          className="workflow-page-header workflow-page-header--compact"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0, 0, 1] as [number,number,number,number] }}
        >
          <div className="workflow-page-header-left">
            <p className="workflow-page-breadcrumb">
              <span style={{ opacity: 0.55 }}>AlphaCI</span>
              <span className="workflow-page-breadcrumb-sep">/</span>
              <span>Workflows</span>
            </p>
            <div className="workflow-page-title-row">
              <h1 className="workflow-page-title">
                Create &amp; Manage Projects
              </h1>
              <div className="workflow-page-studio-badge">
                <span className="workflow-studio-led" aria-hidden="true" />
                Studio active
              </div>
            </div>
          </div>
        </motion.div>

        <WorkflowBuilder
          login={session?.user.login ?? "builder"}
          plan={session?.subscription.plan ?? "pro"}
          guest={guest}
          session={session}
          onboardingCompleted={session?.user.onboardingCompleted}
        />
      </div>
    </main>
    </WorkspaceProvider>
  );
}
