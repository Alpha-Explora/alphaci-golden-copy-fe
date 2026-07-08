"use client";

import { motion } from "framer-motion";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { FilePathLabel } from "@/components/ui/file-path-label";
import type { GitHubRepo, ProvisionedProject } from "@/lib/api/contracts";

import { EASE_OUT } from "./home-bento-grid";

interface HomeRepositoriesPanelProps {
  confirmDisconnectId: string | null;
  disconnectingId: string | null;
  filteredRepos: GitHubRepo[];
  guest: boolean;
  handleDisconnect: (id: string) => Promise<void>;
  handleSync: () => Promise<void>;
  isSyncing: boolean;
  loadProjects: () => void;
  loadRepos: () => void;
  normalizedRepoQuery: string;
  prefersReducedMotion: boolean | null;
  projects: ProvisionedProject[];
  projectsError: string | null;
  projectsLoading: boolean;
  repoQuery: string;
  repos: GitHubRepo[];
  reposError: string | null;
  reposLoading: boolean;
  setConfirmDisconnectId: (id: string | null) => void;
  setRepoQuery: (query: string) => void;
  syncResult: { orphaned: number; reachable: number; total: number } | null;
}

export function projectBorderClass(status: string) {
  if (status === "provisioned") return "repo-card-success";
  if (status === "failed") return "repo-card-danger";
  if (status === "orphaned") return "repo-card-amber";
  return "repo-card-brand";
}

export function projectStatusBadgeTone(status: string): BadgeProps["tone"] {
  if (status === "provisioned") return "success";
  if (status === "failed") return "danger";
  if (status === "orphaned") return "warning";
  return "info";
}

export function HomeRepositoriesPanel({
  confirmDisconnectId,
  disconnectingId,
  filteredRepos,
  guest,
  handleDisconnect,
  handleSync,
  isSyncing,
  loadProjects,
  loadRepos,
  normalizedRepoQuery,
  prefersReducedMotion,
  projects,
  projectsError,
  projectsLoading,
  repoQuery,
  repos,
  reposError,
  reposLoading,
  setConfirmDisconnectId,
  setRepoQuery,
  syncResult,
}: Readonly<HomeRepositoriesPanelProps>) {
  return (
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
          <ButtonLink href="/login">Sign in</ButtonLink>
        </div>
      ) : (
        <>
          <section aria-label="Provisioned projects">
            <div className="dash-section-label">
              <div className="dash-section-label-left">
                <FilePathLabel as="p" className="text-[var(--brand)]">projects/provisioned.yml</FilePathLabel>
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
                <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={loadProjects}>Retry</Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(15, 23, 42, 0.3)", borderRadius: "var(--radius-card)" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.88rem" }}>No projects provisioned yet.</p>
                <ButtonLink href="/workflows">Create your first project</ButtonLink>
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
                        <Badge tone={projectStatusBadgeTone(project.status)} dot>
                          {project.status}
                        </Badge>
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

          {!reposLoading && repos.length > 0 && (
            <section aria-label="GitHub repositories">
              <div className="dash-section-label">
                <div className="dash-section-label-left">
                  <FilePathLabel as="p" className="text-[var(--brand)]">repos/github.yml</FilePathLabel>
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
                    onChange={(event) => setRepoQuery(event.target.value)}
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
                      <Badge className="dash-repo-row-chip" tone={repo.private ? "neutral" : "success"} dot>
                        {repo.private ? "private" : "public"}
                      </Badge>
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
              <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={loadRepos}>Retry</Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
