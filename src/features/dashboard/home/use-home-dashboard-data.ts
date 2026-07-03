"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuthSessionStatus } from "@/hooks/use-auth-session";
import { disconnectProject, getGithubRepos, getProjects, getWorkflowHistory, syncProjects } from "@/lib/api/client";
import type { GitHubRepo, ProvisionedProject, WorkflowHistoryItem } from "@/lib/api/contracts";

import type { DashTab } from "./home-bento-grid";

interface UseHomeDashboardDataOptions {
  status: AuthSessionStatus;
  selectedWorkspaceId: string | null;
}

export function useHomeDashboardData({ status, selectedWorkspaceId }: Readonly<UseHomeDashboardDataOptions>) {
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [projects, setProjects] = useState<ProvisionedProject[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [repoQuery, setRepoQuery] = useState("");
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ orphaned: number; reachable: number; total: number } | null>(null);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    setHistoryError(null);
    getWorkflowHistory(25)
      .then((response) => {
        setHistory(response.items);
        setHistoryError(null);
      })
      .catch(() => setHistoryError("Could not load workflow history."))
      .finally(() => setHistoryLoading(false));
  }, []);

  const loadProjects = useCallback(() => {
    setProjectsLoading(true);
    setProjectsError(null);
    setProjects([]);
    getProjects(25, { workspaceId: selectedWorkspaceId })
      .then((response) => {
        setProjects(response.items);
        setProjectsError(null);
      })
      .catch(() => setProjectsError("Could not load projects."))
      .finally(() => setProjectsLoading(false));
  }, [selectedWorkspaceId]);

  const loadRepos = useCallback(() => {
    setReposLoading(true);
    setReposError(null);
    getGithubRepos()
      .then((response) => {
        setRepos(response.repos);
        setReposError(null);
      })
      .catch(() => setReposError("Could not load GitHub repositories."))
      .finally(() => setReposLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "signed-in") return;
    loadHistory();
    loadProjects();
    loadRepos();
  }, [loadHistory, loadProjects, loadRepos, status]);

  useEffect(() => {
    if (activeTab !== "repositories") return;
    void (async () => {
      try {
        await syncProjects();
        const updated = await getProjects(25, { workspaceId: selectedWorkspaceId });
        setProjects(updated.items);
      } catch {
        // The manual "Sync with GitHub" button remains available.
      }
    })();
  }, [activeTab, selectedWorkspaceId]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncProjects();
      setSyncResult(result);
      const updated = await getProjects(25, { workspaceId: selectedWorkspaceId });
      setProjects(updated.items);
    } catch {
      // Leave the current project list in place if sync fails.
    } finally {
      setIsSyncing(false);
    }
  }, [selectedWorkspaceId]);

  const handleDisconnect = useCallback(async (id: string) => {
    setDisconnectingId(id);
    try {
      await disconnectProject(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
      setConfirmDisconnectId(null);
    } catch {
      // Leave the row visible if disconnect fails.
    } finally {
      setDisconnectingId(null);
    }
  }, []);

  const normalizedRepoQuery = repoQuery.trim().toLowerCase();
  const filteredRepos = normalizedRepoQuery
    ? repos.filter((repo) =>
        repo.fullName.toLowerCase().includes(normalizedRepoQuery) ||
        (repo.description ?? "").toLowerCase().includes(normalizedRepoQuery))
    : repos;

  const uniqueServices = new Set(history.map((item) => item.serviceName)).size;
  const lastActivityValue = history[0]
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(history[0].createdAt))
    : "None yet";

  return {
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
  };
}
