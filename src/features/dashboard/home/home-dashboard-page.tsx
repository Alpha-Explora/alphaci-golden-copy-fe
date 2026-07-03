"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";

import { AppNav } from "@/components/layout/app-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { FlowBackground } from "@/components/layout/flow-background";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider, useWorkspaceSelection } from "@/components/layout/workspace-context";
import { WelcomeModal } from "@/components/product/welcome-modal";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/api/client";
import { completeOnboarding } from "@/lib/api/auth";
import { isGuest } from "@/lib/auth/subscription";

import { HomeActivityPanel } from "./home-activity-panel";
import { HomeDashboardHeader } from "./home-dashboard-header";
import { HomeDashboardTabs } from "./home-dashboard-tabs";
import { HomeOverviewPanel } from "./home-overview-panel";
import { HomeRepositoriesPanel } from "./home-repositories-panel";
import { useHomeDashboardData } from "./use-home-dashboard-data";


/* Page */

function HomeDashboardContent() {
  const router = useRouter();
  const { status, session, error, refresh } = useAuthSession();
  const { selectedWorkspaceId } = useWorkspaceSelection();
  const prefersReducedMotion = useReducedMotion();
  const [isLoggingOut, setIsLoggingOut]     = useState(false);
  const [logoutMessage, setLogoutMessage]   = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const {
    activeTab,
    confirmDisconnectId,
    disconnectingId,
    filteredRepos,
    handleDisconnect,
    handleSync,
    history,
    historyError,
    historyLoading,
    isSyncing,
    lastActivityValue,
    loadHistory,
    loadProjects,
    loadRepos,
    normalizedRepoQuery,
    projects,
    projectsError,
    projectsLoading,
    repoQuery,
    repos,
    reposError,
    reposLoading,
    setActiveTab,
    setConfirmDisconnectId,
    setRepoQuery,
    syncResult,
    uniqueServices,
  } = useHomeDashboardData({ status, selectedWorkspaceId });
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

  function handleWelcomeDismiss() {
    setWelcomeDismissed(true);
    // Fire-and-forget: mark complete server-side. Idempotent if the tour also
    // calls completeOnboarding later.
    completeOnboarding().catch(() => {
      // Non-fatal - the modal is already hidden optimistically.
    });
  }

  /* Guard: loading */
  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/signup");
    }
  }, [router, status]);
  if (status === "loading") {
    return <PipelineLoader label="Loading your dashboard" />;
  }

  if (status === "signed-out") {
    return <PipelineLoader label="Redirecting to sign up" />;
  }

  /* Guard: error */
  if (status === "error") {
    return (
      <DashboardShell suppressHydrationWarning={false}>
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
            <p>We could not verify your session. Please retry or sign in again.</p>
            <div className="hero-actions">
              <Button type="button" onClick={() => void refresh()}>
                Retry
              </Button>
              <ButtonLink variant="ghost" href="/login?next=/home">Go to login</ButtonLink>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  /* Signed-in app */
  const guest = isGuest(session);

  // Show the welcome modal for authenticated new users who have not yet
  // completed onboarding and have not dismissed it this session.
  const showWelcome =
    status === "signed-in" &&
    !guest &&
    !welcomeDismissed &&
    session?.user.onboardingCompleted === false;

  const avatarInitial = (session?.user.name ?? session?.user.login ?? "U").slice(0, 1).toUpperCase();

  return (
    <DashboardShell>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FlowBackground />

      <AppNav
        guest={guest}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />

      {/* Welcome modal - shown once for new authenticated users */}
      {showWelcome && (
        <WelcomeModal
          displayName={session?.user.login ?? session?.user.name ?? "there"}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {guest && (
        <div className="guest-banner glass-panel" role="alert" style={{
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)",
          border: "1px solid var(--border-brand)",
          padding: "1rem var(--layout-gutter)",
          borderRadius: "0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: "0.88rem" }}>
            Sign up to unlock AlphaCI.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <ButtonLink href="/signup" size="sm">
              Sign up free
            </ButtonLink>
            <ButtonLink href="/login" size="sm" variant="ghost">
              Log in
            </ButtonLink>
          </div>
        </div>
      )}

      <DashboardPageContent>

        <HomeDashboardHeader
          avatarInitial={avatarInitial}
          error={error}
          guest={guest}
          logoutMessage={logoutMessage}
          prefersReducedMotion={prefersReducedMotion}
          session={session}
        />
        <HomeDashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          prefersReducedMotion={prefersReducedMotion}
        />
        {/* Tab panels */}
        <AnimatePresence mode="wait">

          {activeTab === "overview" && (
            <HomeOverviewPanel
              guest={guest}
              historyError={historyError}
              historyLength={history.length}
              historyLoading={historyLoading}
              lastActivityValue={lastActivityValue}
              loadHistory={loadHistory}
              loadProjects={loadProjects}
              prefersReducedMotion={prefersReducedMotion}
              projectsError={projectsError}
              projectsLength={projects.length}
              projectsLoading={projectsLoading}
              uniqueServices={uniqueServices}
            />
          )}
          {activeTab === "repositories" && (
            <HomeRepositoriesPanel
              confirmDisconnectId={confirmDisconnectId}
              disconnectingId={disconnectingId}
              filteredRepos={filteredRepos}
              guest={guest}
              handleDisconnect={handleDisconnect}
              handleSync={handleSync}
              isSyncing={isSyncing}
              loadProjects={loadProjects}
              loadRepos={loadRepos}
              normalizedRepoQuery={normalizedRepoQuery}
              prefersReducedMotion={prefersReducedMotion}
              projects={projects}
              projectsError={projectsError}
              projectsLoading={projectsLoading}
              repoQuery={repoQuery}
              repos={repos}
              reposError={reposError}
              reposLoading={reposLoading}
              setConfirmDisconnectId={setConfirmDisconnectId}
              setRepoQuery={setRepoQuery}
              syncResult={syncResult}
            />
          )}
          {activeTab === "activity" && (
            <HomeActivityPanel
              history={history}
              historyError={historyError}
              historyLoading={historyLoading}
              loadHistory={loadHistory}
              prefersReducedMotion={prefersReducedMotion}
            />
          )}
        </AnimatePresence>

      </DashboardPageContent>
    </DashboardShell>
  );
}

export default function HomeDashboardPage() {
  return (
    <WorkspaceProvider>
      <HomeDashboardContent />
    </WorkspaceProvider>
  );
}
