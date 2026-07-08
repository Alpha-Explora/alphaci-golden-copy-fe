"use client";

import { useEffect, useMemo, useState } from "react";

import { useWorkspaceSelection } from "@/components/layout/workspace-context";
import type { ProvisionedProject, WorkspacesMeResponse } from "@/lib/api/contracts";
import { getProjects } from "@/lib/api/projects";
import { getMyWorkspaces } from "@/lib/api/workspaces";

interface UseAppNavDataOptions {
  guest: boolean;
}

export function useAppNavData({ guest }: Readonly<UseAppNavDataOptions>) {
  const [workspaces, setWorkspacesState] = useState<WorkspacesMeResponse | null>(null);
  const [projects, setProjects] = useState<ProvisionedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { selectedWorkspaceId, setWorkspaces } = useWorkspaceSelection();

  useEffect(() => {
    if (guest) return;
    let active = true;
    void getMyWorkspaces()
      .then((response) => {
        if (!active) return;
        setWorkspacesState(response);
        setWorkspaces(response);
      })
      .catch(() => {
        if (!active) return;
        setWorkspacesState({ enabled: false, items: [] });
        setWorkspaces(null);
      });
    return () => {
      active = false;
    };
  }, [guest, setWorkspaces]);

  useEffect(() => {
    if (guest) return;
    let active = true;
    void getProjects(25, { workspaceId: selectedWorkspaceId })
      .then((response) => {
        if (!active) return;
        setProjects(response.items);
        setSelectedProjectId((current) => {
          const currentStillExists = current ? response.items.some((project) => project.id === current) : false;
          if (currentStillExists) return current;
          return response.items.find((project) => !project.isExample)?.id ?? response.items[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (!active) return;
        setProjects([]);
        setSelectedProjectId(null);
      });
    return () => {
      active = false;
    };
  }, [guest, selectedWorkspaceId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects.find((project) => !project.isExample) ?? projects[0] ?? null,
    [projects, selectedProjectId],
  );

  return { projects, selectedProject, workspaces };
}