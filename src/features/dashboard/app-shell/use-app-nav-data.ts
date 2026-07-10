"use client";

import { useEffect, useMemo, useState } from "react";

import { useWorkspaceSelection } from "@/components/layout/workspace-context";
import type { NotificationsResponse, ProvisionedProject, WorkspacesMeResponse } from "@/lib/api/contracts";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications";
import { getProjects } from "@/lib/api/projects";
import { getMyWorkspaces } from "@/lib/api/workspaces";

interface UseAppNavDataOptions {
  guest: boolean;
}

export function useAppNavData({ guest }: Readonly<UseAppNavDataOptions>) {
  const [workspaces, setWorkspacesState] = useState<WorkspacesMeResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [projects, setProjects] = useState<ProvisionedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { selectedWorkspaceId, setWorkspaces } = useWorkspaceSelection();

  useEffect(() => {
    if (guest) {
      setWorkspacesState(null);
      setNotifications(null);
      return;
    }
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
    void getNotifications()
      .then((response) => {
        if (active) setNotifications(response);
      })
      .catch(() => {
        if (active) setNotifications({ enabled: false, unreadCount: 0, items: [] });
      });
    return () => {
      active = false;
    };
  }, [guest]);

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

  async function handleMarkNotificationRead(id: string) {
    await markNotificationRead(id);
    setNotifications((current) => {
      if (!current) return current;
      const items = current.items.map((notification) => {
        if (notification.id !== id || notification.readAt) return notification;
        return { ...notification, readAt: new Date().toISOString() };
      });
      return {
        ...current,
        items,
        unreadCount: items.filter((notification) => !notification.readAt).length,
      };
    });
  }

  return { handleMarkNotificationRead, notifications, projects, selectedProject, workspaces };
}
