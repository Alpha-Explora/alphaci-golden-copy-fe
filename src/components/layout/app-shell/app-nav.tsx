"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { NotificationCenter } from "@/components/layout/notification-center";
import { PipelineLogo } from "@/components/layout/pipeline-logo";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import type { useAuthSession } from "@/hooks/use-auth-session";
import type { NotificationsResponse, WorkspacesMeResponse } from "@/lib/api/contracts";

import {
  AdminIcon,
  BillingIcon,
  ChevronLeftIcon,
  DashboardIcon,
  RunsIcon,
  SettingsIcon,
  SidebarNavItem,
  SidebarSectionLabel,
  SignOutIcon,
  WorkflowsIcon,
} from "./app-nav-parts";
import styles from "./app-nav.module.css";

interface AppNavProps {
  guest: boolean;
  session: ReturnType<typeof useAuthSession>["session"];
  onLogout: () => void;
  isLoggingOut: boolean;
  workspaces: WorkspacesMeResponse | null;
  notifications: NotificationsResponse | null;
  onMarkNotificationRead: (id: string) => Promise<void> | void;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppNav({
  guest,
  session,
  onLogout,
  isLoggingOut,
  workspaces,
  notifications,
  onMarkNotificationRead,
}: Readonly<AppNavProps>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;
  const sidebarRef = useRef<HTMLElement>(null);

  const avatarInitial = (session?.user.name ?? session?.user.login ?? "U").slice(0, 1).toUpperCase();
  const isPlatformAdmin = !guest && Boolean(session?.platformRole);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) setCollapsed(true);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "64px" : "220px");
  }, [collapsed]);

  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <motion.aside ref={sidebarRef} className={styles.sidebar} data-app-nav="true" data-collapsed={collapsed ? "true" : "false"} animate={{ width: sidebarWidth }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 34, mass: 0.8 }} style={{ width: sidebarWidth }} aria-label="Primary navigation">
      <div className={styles.edgeGradient} aria-hidden="true" />
      <div className={cx(styles.brandZone, collapsed && styles.brandZoneCollapsed)}>
        <Link href="/home" className={cx(styles.brandLink, collapsed && styles.brandLinkCollapsed)} aria-label="AlphaCI home">
          <span className={cx(styles.brandLogo, collapsed && styles.brandLogoCollapsed)}><PipelineLogo size={22} /></span>
          <AnimatePresence initial={false}>{!collapsed && <motion.span className={styles.brandWordmark} initial={reduced ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>Alpha<span className={styles.brandAccent}>CI</span></motion.span>}</AnimatePresence>
        </Link>
        <motion.button type="button" className={cx(styles.collapseButton, collapsed && styles.collapseButtonCollapsed)} onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} whileHover={reduced ? undefined : { scale: 1.12, backgroundColor: "rgba(99,102,241,0.18)" }} whileTap={reduced ? undefined : { scale: 0.88 }} transition={{ type: "spring", stiffness: 420, damping: 24 }}>
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }} style={{ display: "flex" }}><ChevronLeftIcon size={14} /></motion.span>
        </motion.button>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        <SidebarSectionLabel text="Main" collapsed={collapsed} />
        <SidebarNavItem href="/home" label="Dashboard" icon={DashboardIcon} isActive={pathname === "/home"} collapsed={collapsed} reduced={reduced} itemIndex={0} />
        <SidebarNavItem href="/workflows" label="Workflows" icon={WorkflowsIcon} isActive={pathname === "/workflows"} collapsed={collapsed} reduced={reduced} itemIndex={1} />
        <SidebarNavItem href="/runs" label="Runs" icon={RunsIcon} isActive={pathname === "/runs"} collapsed={collapsed} reduced={reduced} itemIndex={2} />
        <SidebarSectionLabel text="Account" collapsed={collapsed} />
        <SidebarNavItem href="/subscribe" label="Billing" icon={BillingIcon} isActive={pathname === "/subscribe"} collapsed={collapsed} reduced={reduced} itemIndex={3} />
        {!guest && <SidebarNavItem href="/settings" label="Settings" icon={SettingsIcon} isActive={pathname === "/settings"} collapsed={collapsed} reduced={reduced} itemIndex={4} />}
        {isPlatformAdmin && <SidebarNavItem href="/admin" label="Admin" icon={AdminIcon} isActive={pathname.startsWith("/admin")} collapsed={collapsed} reduced={reduced} itemIndex={5} />}
      </nav>

      <div className={styles.bottomZone}>
        {!guest && (
          <>
            <div className={styles.bottomUtilities}><WorkspaceSwitcher workspaces={workspaces} /><div className={styles.utilityActions}><NotificationCenter notifications={notifications} onMarkRead={onMarkNotificationRead} /></div></div>
            <div className={styles.userChip} aria-label={`Signed in as ${session?.user.login ?? "user"}`}>
              <span className={styles.userAvatarRing}>{session?.user.avatarUrl ? <Image src={session.user.avatarUrl} alt={session.user.name ?? session.user.login} width={28} height={28} className={styles.userAvatarImg} unoptimized /> : <span className={styles.userAvatarFallback} aria-hidden="true">{avatarInitial}</span>}</span>
              <AnimatePresence initial={false}>{!collapsed && <motion.div className={styles.userInfo} initial={reduced ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -8 }} transition={{ duration: 0.16 }}><span className={styles.userLogin}>{session?.user.login ?? "user"}</span>{session?.subscription.plan && <span className={styles.userPlanBadge}>{session.subscription.plan}</span>}</motion.div>}</AnimatePresence>
            </div>
            <button type="button" onClick={onLogout} disabled={isLoggingOut} aria-label={isLoggingOut ? "Signing out..." : "Sign out"} className={styles.signoutButton}>
              {isLoggingOut ? <span className={styles.signoutSpinner} aria-hidden="true" /> : <SignOutIcon size={15} />}
              <AnimatePresence initial={false}>{!collapsed && <motion.span initial={reduced ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -8 }} transition={{ duration: 0.16 }} className={styles.signoutLabel}>{isLoggingOut ? "Signing out..." : "Sign out"}</motion.span>}</AnimatePresence>
            </button>
          </>
        )}
        {guest && <Link className={styles.signUpButton} href="/signup">{collapsed ? "Start" : "Sign up"}</Link>}
      </div>
    </motion.aside>
  );
}
