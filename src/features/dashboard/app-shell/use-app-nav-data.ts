"use client";

import { useCallback, useEffect, useState } from "react";

import { useWorkspaceSelection } from "@/components/layout/workspace-context";
import type { NotificationsResponse, WorkspacesMeResponse } from "@/lib/api/contracts";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications";
import { getMyWorkspaces } from "@/lib/api/workspaces";

interface UseAppNavDataOptions {
  guest: boolean;
}

export function useAppNavData({ guest }: Readonly<UseAppNavDataOptions>) {
  const [workspaces, setWorkspacesState] = useState<WorkspacesMeResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const { setWorkspaces } = useWorkspaceSelection();

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
    return () => { active = false; };
  }, [guest, setWorkspaces]);

  useEffect(() => {
    if (guest) return;
    let active = true;
    void getNotifications()
      .then((response) => { if (active) setNotifications(response); })
      .catch(() => { if (active) setNotifications({ enabled: false, items: [], unreadCount: 0 }); });
    return () => { active = false; };
  }, [guest]);

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((current) => current ? {
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      items: current.items.map((item) => item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item),
    } : current);
  }, []);

  return {
    workspaces,
    notifications,
    handleMarkNotificationRead,
  };
}
