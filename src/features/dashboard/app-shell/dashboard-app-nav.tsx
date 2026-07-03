"use client";

import { AppNav } from "@/components/layout/app-shell/app-nav";
import type { useAuthSession } from "@/hooks/use-auth-session";

import { useAppNavData } from "./use-app-nav-data";

interface DashboardAppNavProps {
  guest: boolean;
  session: ReturnType<typeof useAuthSession>["session"];
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function DashboardAppNav({ guest, session, onLogout, isLoggingOut }: Readonly<DashboardAppNavProps>) {
  const { workspaces, notifications, handleMarkNotificationRead } = useAppNavData({ guest });

  return (
    <AppNav
      guest={guest}
      session={session}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
      workspaces={workspaces}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
    />
  );
}
