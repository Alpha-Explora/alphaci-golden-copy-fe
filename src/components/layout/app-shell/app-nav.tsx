"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { useAuthSession } from "@/hooks/use-auth-session";
import type { ProvisionedProject, WorkspacesMeResponse } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

import { AppHeader } from "./app-header";
import {
  AdminIcon,
  ChevronLeftIcon,
  DashboardIcon,
  RunsIcon,
  SettingsIcon,
  SidebarNavItem,
  SidebarSectionLabel,
  SignOutIcon,
  WorkflowsIcon,
} from "./app-nav-parts";

interface AppNavProps {
  guest: boolean;
  session: ReturnType<typeof useAuthSession>["session"];
  onLogout: () => void;
  isLoggingOut: boolean;
  workspaces: WorkspacesMeResponse | null;
  projects: ProvisionedProject[];
  selectedProject: ProvisionedProject | null;
  showSidebar?: boolean;
}

export function AppNav({
  guest,
  session,
  onLogout,
  isLoggingOut,
  workspaces,
  projects,
  selectedProject,
  showSidebar = true,
}: Readonly<AppNavProps>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;
  const sidebarRef = useRef<HTMLElement>(null);
  const isPlatformAdmin = !guest && Boolean(session?.platformRole);

  useEffect(() => {
    if (!showSidebar) return undefined;

    function handleResize() {
      if (window.innerWidth <= 768) setCollapsed(true);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar]);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", showSidebar ? (collapsed ? "64px" : "220px") : "0px");
  }, [collapsed, showSidebar]);

  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <>
      <AppHeader
        guest={guest}
        session={session}
        workspaces={workspaces}
        projects={projects}
        selectedProject={selectedProject}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      {showSidebar ? (
        <motion.aside
          ref={sidebarRef}
          className="fixed bottom-0 left-0 z-[80] isolate flex flex-col overflow-visible border-r border-slate-400/15 bg-[rgba(7,11,22,0.98)] text-[var(--text-primary)] [height:calc(100dvh_-_var(--app-header-height,44px))] [top:var(--app-header-height,44px)]"
          data-app-nav="true"
          data-collapsed={collapsed ? "true" : "false"}
          animate={{ width: sidebarWidth }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 360, damping: 34, mass: 0.8 }
          }
          style={{ width: sidebarWidth }}
          aria-label="Primary navigation"
        >
          <div className="relative z-[1] flex min-h-[2.65rem] items-center justify-end border-b border-slate-400/10 px-[0.55rem] py-2">
            <motion.button
              type="button"
              className={cn(
                "inline-flex size-7 flex-none cursor-pointer items-center justify-center rounded-[7px] border border-slate-400/20 bg-slate-900/40 text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
                collapsed && "w-[1.7rem]",
              )}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              whileHover={reduced ? undefined : { backgroundColor: "rgba(148, 163, 184, 0.12)" }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.16 }}
            >
              <motion.span
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.16 }}
                style={{ display: "flex" }}
              >
                <ChevronLeftIcon size={14} />
              </motion.span>
            </motion.button>
          </div>

          <nav className="relative z-[1] flex min-h-0 flex-1 flex-col gap-[0.24rem] overflow-visible px-[0.45rem] py-[0.55rem]" aria-label="Primary">
            <SidebarSectionLabel text="Main" collapsed={collapsed} />
            <SidebarNavItem href="/home" label="Dashboard" icon={DashboardIcon} isActive={pathname === "/home"} collapsed={collapsed} reduced={reduced} itemIndex={0} />
            <SidebarNavItem href="/workflows" label="Workflows" icon={WorkflowsIcon} isActive={pathname === "/workflows"} collapsed={collapsed} reduced={reduced} itemIndex={1} />
            <SidebarNavItem href="/runs" label="Runs" icon={RunsIcon} isActive={pathname === "/runs"} collapsed={collapsed} reduced={reduced} itemIndex={2} />
            <SidebarSectionLabel text="Account" collapsed={collapsed} />
            {!guest && <SidebarNavItem href="/settings" label="Settings" icon={SettingsIcon} isActive={pathname === "/settings"} collapsed={collapsed} reduced={reduced} itemIndex={3} />}
            {isPlatformAdmin && <SidebarNavItem href="/admin" label="Admin" icon={AdminIcon} isActive={pathname.startsWith("/admin")} collapsed={collapsed} reduced={reduced} itemIndex={4} />}
          </nav>

          <div className="relative z-[1] grid gap-[0.55rem] border-t border-slate-400/10 px-[0.45rem] pb-3 pt-[0.65rem]">
            {!guest && (
              <button type="button" onClick={onLogout} disabled={isLoggingOut} aria-label={isLoggingOut ? "Signing out..." : "Sign out"} className="inline-flex min-h-[2.1rem] w-full items-center justify-center gap-[0.55rem] rounded-[7px] border border-slate-400/15 bg-transparent px-[0.7rem] py-[0.48rem] text-[0.8rem] font-semibold text-[var(--text-secondary)] no-underline not-disabled:hover:border-red-300/25 not-disabled:hover:bg-red-400/10 not-disabled:hover:text-[var(--danger)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-[0.58]">
                {isLoggingOut ? <span className="size-[0.9rem] animate-spin rounded-full border-2 border-slate-400/30 border-t-[var(--brand)]" aria-hidden="true" /> : <SignOutIcon size={15} />}
                <AnimatePresence initial={false}>{!collapsed && <motion.span initial={reduced ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -8 }} transition={{ duration: 0.16 }} className="whitespace-nowrap">{isLoggingOut ? "Signing out..." : "Sign out"}</motion.span>}</AnimatePresence>
              </button>
            )}
            {guest && <Link className="inline-flex min-h-[2.1rem] w-full items-center justify-center rounded-[7px] border border-cyan-400/45 bg-cyan-400/10 px-[0.7rem] py-[0.48rem] text-[0.8rem] font-semibold text-[var(--text-primary)] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]" href="/signup">{collapsed ? "Start" : "Sign up"}</Link>}
          </div>
        </motion.aside>
      ) : null}
    </>
  );
}
