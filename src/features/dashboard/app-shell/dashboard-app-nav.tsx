"use client";

import { AppNav } from "@/components/layout/app-shell/app-nav";
import type { useAuthSession } from "@/hooks/use-auth-session";

import { useAppNavData } from "./use-app-nav-data";

interface DashboardAppNavProps {
  guest: boolean;
  session: ReturnType<typeof useAuthSession>["session"];
  onLogout: () => void;
  isLoggingOut: boolean;
  showSidebar?: boolean;
}

export function DashboardAppNav({ guest, session, onLogout, isLoggingOut, showSidebar = true }: Readonly<DashboardAppNavProps>) {
  const { projects, selectedProject, workspaces } = useAppNavData({ guest });

  return (
    <AppNav
      guest={guest}
      session={session}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
      workspaces={workspaces}
      projects={projects}
      selectedProject={selectedProject}
      showSidebar={showSidebar}
    />
  );
}