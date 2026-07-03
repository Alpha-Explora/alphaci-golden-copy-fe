"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AppNav } from "@/components/layout/app-nav";
import { FlowBackground } from "@/components/layout/flow-background";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider, useWorkspaceSelection } from "@/components/layout/workspace-context";
import { WelcomeModal } from "@/components/product/welcome-modal";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/api/client";
import { completeOnboarding } from "@/lib/api/auth";
import { isGuest } from "@/lib/auth/subscription";

import { EASE_OUT } from "./home-bento-grid";
import { HomeActivityPanel } from "./home-activity-panel";
import { HomeDashboardHeader } from "./home-dashboard-header";
import { HomeDashboardTabs } from "./home-dashboard-tabs";
import { HomeOverviewPanel } from "./home-overview-panel";
import { projectBorderClass, projectStatusChipClass, useHomeDashboardData } from "./use-home-dashboard-data";


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
      <main className="dash-shell">
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
              <button className="primary-button" type="button" onClick={() => void refresh()}>
                Retry
              </button>
              <Link className="ghost-button" href="/login?next=/home">Go to login</Link>
            </div>
          </div>
        </div>
      </main>
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
    <main className="dash-shell" suppressHydrationWarning style={{ overflowX: "hidden" }}>
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
            <Link className="primary-button" href="/signup" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
              Sign up free
            </Link>
            <Link className="ghost-button" href="/login" style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem" }}>
              Log in
            </Link>
          </div>
        </div>
      )}

      <div id="main-content" className="dash-page-content">

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
          {/* Repositories tab */}
          {activeTab === "repositories" && (
            <motion.div
              key="repositories"
              id="dash-panel-repositories"
              role="tabpanel"
              aria-labelledby="dash-tab-repositories"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {guest ? (
                <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(15, 23, 42, 0.3)", borderRadius: "var(--radius-card)" }}>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>Sign in to see your repositories.</p>
                  <Link className="primary-button" href="/login" style={{ padding: "0.65rem 1.5rem", fontSize: "0.9rem" }}>Sign in</Link>
                </div>
              ) : (
                <>
                  {/* Provisioned Projects */}
                  <section aria-label="Provisioned projects">
                    <div className="dash-section-label">
                      <div className="dash-section-label-left">
                        <p className="file-path-label" style={{ marginBottom: 0, color: "var(--brand)" }}>projects/provisioned.yml</p>
                        {!projectsLoading && projects.length > 0 && (
                          <span className="dash-count-chip">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>

                    {projectsLoading ? (
                      <div className="repo-grid">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="skeleton-card glass-panel" style={{ minHeight: "6.5rem", background: "rgba(15, 23, 42, 0.3)", animation: "state-pulse 1.5s infinite" }} />
                        ))}
                      </div>
                    ) : projectsError ? (
                      <div className="error-inline glass-panel" role="alert" style={{ background: "rgba(248, 113, 113, 0.05)" }}>
                        <span className="error-inline-icon" aria-hidden="true">!</span>
                        <p className="error-inline-msg">{projectsError}</p>
                        <button className="error-retry-btn" type="button" onClick={loadProjects}>Retry</button>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(15, 23, 42, 0.3)", borderRadius: "var(--radius-card)" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.88rem" }}>No projects provisioned yet.</p>
                        <Link className="primary-button" href="/workflows" style={{ padding: "0.65rem 1.5rem", fontSize: "0.9rem" }}>Create your first project</Link>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "0.75rem", alignItems: "center" }}>
                          {syncResult && (
                            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              Sync complete - {syncResult.orphaned} orphaned, {syncResult.reachable} reachable
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleSync()}
                            disabled={isSyncing}
                            className="dash-sync-btn"
                          >
                            {isSyncing ? "Syncing..." : "Sync with GitHub"}
                          </button>
                        </div>
                        <div className="repo-grid" aria-label="Provisioned projects">
                          {projects.map((project) => (
                            <article key={project.id} className={`repo-card glass-panel ${projectBorderClass(project.status)}`}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.5rem" }}>
                                <a
                                  href={project.repoUrl ?? `https://github.com/${project.repoFullName}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="repo-card-title"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                  </svg>
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {project.repoFullName.split("/")[1] ?? project.repoFullName}
                                  </span>
                                </a>
                                <span className={projectStatusChipClass(project.status)}>
                                  {project.status}
                                </span>
                              </div>

                              <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: 0, fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {project.serviceName}
                              </p>

                              <div className="repo-card-meta">
                                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "ui-monospace, monospace" }}>
                                  {project.workflowPath}
                                </span>
                                {project.githubCommitUrl ? (
                                  <a href={project.githubCommitUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    View commit
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                                    </svg>
                                  </a>
                                ) : (
                                  <a href={project.repoUrl ?? `https://github.com/${project.repoFullName}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    Browse
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                                    </svg>
                                  </a>
                                )}
                              </div>

                              {confirmDisconnectId === project.id ? (
                                <div className="repo-card-confirm-row">
                                  <span className="repo-card-confirm-label">
                                    Remove from AlphaCI? GitHub repo is untouched.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleDisconnect(project.id)}
                                    disabled={disconnectingId === project.id}
                                    className="confirm-btn-danger"
                                  >
                                    {disconnectingId === project.id ? "Removing..." : "Yes, remove"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDisconnectId(null)}
                                    className="confirm-btn-neutral"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDisconnectId(project.id)}
                                  className="dash-disconnect-link"
                                  style={{ marginTop: "0.5rem" }}
                                >
                                  Disconnect
                                </button>
                              )}
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                  </section>

                  {/* Connected GitHub repos: compact searchable list */}
                  {!reposLoading && repos.length > 0 && (
                    <section aria-label="GitHub repositories">
                      <div className="dash-section-label">
                        <div className="dash-section-label-left">
                          <p className="file-path-label" style={{ marginBottom: 0, color: "var(--brand)" }}>repos/github.yml</p>
                          <span className="dash-count-chip">
                            {normalizedRepoQuery
                              ? `${filteredRepos.length} of ${repos.length} repos`
                              : `${repos.length} GitHub repos`}
                          </span>
                        </div>
                        <div className="repo-search">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          <input
                            type="search"
                            value={repoQuery}
                            onChange={(e) => setRepoQuery(e.target.value)}
                            placeholder="Search repositories..."
                            aria-label="Search GitHub repositories"
                          />
                          {repoQuery && (
                            <button type="button" onClick={() => setRepoQuery("")} aria-label="Clear repository search">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredRepos.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: "center", padding: "2.25rem 1.5rem", background: "rgba(15, 23, 42, 0.3)", borderRadius: "var(--radius-card)" }}>
                          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.88rem" }}>
                            No repositories match &quot;{repoQuery}&quot;.
                          </p>
                        </div>
                      ) : (
                        <div className="dash-repo-list" aria-label="GitHub repositories">
                          {filteredRepos.map((repo) => (
                            <article key={repo.id} className="dash-repo-row">
                              <svg className="dash-repo-row-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                              </svg>
                              <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="dash-repo-row-name">
                                {repo.fullName.split("/")[1]}
                              </a>
                              <span className={`dash-repo-row-chip ${repo.private ? "status-chip status-chip-muted" : "status-chip status-chip-success"}`}>
                                {repo.private ? "private" : "public"}
                              </span>
                              <p className="dash-repo-row-desc">
                                {repo.description ?? "No description provided."}
                              </p>
                              <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="dash-repo-row-browse">
                                Browse
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                                </svg>
                              </a>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                  {reposError && !reposLoading && (
                    <div className="error-inline glass-panel" role="alert" style={{ background: "rgba(248, 113, 113, 0.05)" }}>
                      <span className="error-inline-icon" aria-hidden="true">!</span>
                      <p className="error-inline-msg">{reposError}</p>
                      <button className="error-retry-btn" type="button" onClick={loadRepos}>Retry</button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
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

      </div>
    </main>
  );
}

export default function HomeDashboardPage() {
  return (
    <WorkspaceProvider>
      <HomeDashboardContent />
    </WorkspaceProvider>
  );
}
