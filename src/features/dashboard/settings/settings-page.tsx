"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { AppNav } from "@/components/layout/app-nav";
import { FlowBackground } from "@/components/layout/flow-background";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider, useWorkspaceSelection } from "@/components/layout/workspace-context";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { WorkspaceMembersSection } from "@/components/settings/workspace-members-section";
import { Button, ButtonLink } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCapabilities } from "@/hooks/use-capabilities";
import { logout, deleteAccount, cancelMonthlySubscription, getMyUsage } from "@/lib/api/client";
import type { NotificationsResponse, UsageMeResponse, WorkspacesMeResponse } from "@/lib/api/contracts";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications";
import { getMyWorkspaces } from "@/lib/api/workspaces";
import { isGuest } from "@/lib/auth/subscription";

import styles from "./settings-page.module.css";
import { SettingsBillingSection } from "./settings-billing-section";
import { SettingsConnectionsSection } from "./settings-connections-section";
import { SettingsDangerSection } from "./settings-danger-section";
import { SettingsGuideSection } from "./settings-guide-section";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  CreditCardIcon,
  GithubIcon,
  UserIcon,
} from "./settings-icons";
import { HoverField, SettingsSection } from "./settings-section";

type SettingsSectionId = "account" | "connections" | "billing" | "guide" | "danger";

const SECTION_LABELS: Record<SettingsSectionId, string> = {
  account:     "Account",
  connections: "Connections",
  billing:     "Billing",
  guide:       "Guide",
  danger:      "Danger Zone",
};

const EASE_OUT: [number, number, number, number] = [0.25, 0, 0, 1];

const sectionVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: EASE_OUT } },
};

function SettingsPageContent() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { status, session, error, refresh } = useAuthSession();
  const { workspacesEnabled, notificationsEnabled } = useCapabilities();
  const { selectedWorkspace, setWorkspaces: setWorkspaceContext } = useWorkspaceSelection();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");

  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [usage, setUsage] = useState<UsageMeResponse | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspacesMeResponse | null>(null);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed-out") {
      router.push("/login?next=/settings");
    }
  }, [status, router]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const updateLayout = () => setIsCompactLayout(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (activeSection !== "billing") return;
    let active = true;
    void getMyUsage()
      .then((response) => {
        if (active) {
          setUsage(response);
          setUsageError(null);
        }
      })
      .catch(() => {
        if (active) {
          setUsageError("Usage limits are unavailable right now.");
        }
      });
    return () => {
      active = false;
    };
  }, [activeSection]);

  useEffect(() => {
    if (!["account", "billing"].includes(activeSection) || !workspacesEnabled) return;
    let active = true;
    void getMyWorkspaces()
      .then((response) => {
        if (active) {
          setWorkspaces(response);
          setWorkspaceContext(response);
          setWorkspacesError(null);
        }
      })
      .catch(() => {
        if (active) {
          setWorkspacesError("Workspaces are unavailable right now.");
        }
      });
    return () => {
      active = false;
    };
  }, [activeSection, setWorkspaceContext, workspacesEnabled]);

  useEffect(() => {
    if (activeSection !== "account" || !notificationsEnabled) return;
    let active = true;
    void getNotifications()
      .then((response) => {
        if (active) {
          setNotifications(response);
          setNotificationsError(null);
        }
      })
      .catch(() => {
        if (active) {
          setNotificationsError("Notifications are unavailable right now.");
        }
      });
    return () => {
      active = false;
    };
  }, [activeSection, notificationsEnabled]);

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

  async function handleCancelSubscription() {
    if (selectedWorkspaceRole !== "owner" && selectedWorkspaceRole !== "admin") {
      setCancelMessage("Billing management requires owner or admin workspace access.");
      return;
    }

    setIsCanceling(true);
    setCancelMessage(null);
    try {
      await cancelMonthlySubscription();
      await refresh();
      setCancelMessage("Your subscription has been canceled.");
      setShowCancelConfirm(false);
    } catch {
      setCancelMessage("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      await deleteAccount();
      router.push("/");
    } catch {
      setDeleteMessage("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  async function handleMarkNotificationRead(id: string) {
    setMarkingNotificationId(id);
    setNotificationsError(null);
    try {
      await markNotificationRead(id);
      setNotifications((current) =>
        current
          ? {
              ...current,
              unreadCount: Math.max(0, current.unreadCount - 1),
              items: current.items.map((item) =>
                item.id === id
                  ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
                  : item,
              ),
            }
          : current,
      );
    } catch {
      setNotificationsError("Notification update failed.");
    } finally {
      setMarkingNotificationId(null);
    }
  }

  /* Loading */
  if (status === "loading") {
    return <PipelineLoader label="Loading settings" />;
  }

  /* Error */
  if (status === "error") {
    return (
      <main className="flow-shell page-shell">
        <FlowBackground />
        <div className="state-body">
          <div className="state-card">
            <div
              className="state-icon"
              style={{ background: "rgba(255,79,79,0.08)", border: "1px solid rgba(255,79,79,0.2)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1>Session verification failed</h1>
            <p>We could not verify your session. Please retry or sign in again.</p>
            <div className="hero-actions">
              <Button type="button" onClick={() => void refresh()}>Retry</Button>
              <ButtonLink variant="ghost" href="/login?next=/settings">Go to login</ButtonLink>
            </div>
            {error ? <p className="error-text" style={{ fontSize: "0.82rem" }}>{error}</p> : null}
          </div>
        </div>
      </main>
    );
  }

  if (status === "signed-out") return null;

  const guest = isGuest(session);
  const avatarInitial = (session?.user.name ?? session?.user.login ?? "U").slice(0, 1).toUpperCase();
  const selectedWorkspaceRole = selectedWorkspace?.role ?? workspaces?.items[0]?.role ?? null;
  const canManageBilling = selectedWorkspaceRole === "owner" || selectedWorkspaceRole === "admin";

  return (
    <DashboardShell>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FlowBackground />

      <AppNav
        guest={guest}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />

      <DashboardPageContent
        className="settings-layout"
        id="main-content"
        style={{
          padding: isCompactLayout
            ? "1rem 1rem 2.5rem calc(64px + 1rem)"
            : "1.75rem var(--layout-gutter) 2.5rem calc(var(--sidebar-width) + var(--layout-gutter))",
          flex: 1,
          display: "flex",
          flexDirection: isCompactLayout ? "column" : "row",
          gap: "1.75rem",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        {/* Left sidebar nav */}
        <nav
          className="settings-sidebar settings-sidebar-surface"
          aria-label="Settings sections"
          style={{
            width: isCompactLayout ? "100%" : "220px",
            flexShrink: 0,
            position: isCompactLayout ? "relative" : "sticky",
            top: isCompactLayout ? "auto" : "72px",
            alignSelf: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            padding: "1rem",
          }}
        >
          {/* Mini profile summary */}
          <div
            className="settings-sidebar-profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              paddingBottom: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: "50%",
                padding: "1.5px",
                background: "linear-gradient(135deg, var(--brand), var(--accent-violet))",
                flexShrink: 0,
              }}
            >
              {session?.user.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt={session.user.name ?? session.user.login}
                  width={36}
                  height={36}
                  style={{ borderRadius: "50%", display: "block", border: "2px solid var(--bg-base)" }}
                  unoptimized
                />
              ) : (
                <span
                  aria-hidden="true"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--bg-elevated)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    border: "2px solid var(--bg-base)",
                  }}
                >
                  {avatarInitial}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user.name ?? session?.user.login ?? "Account"}
              </p>
              {session?.subscription.plan && (
                <span className="dash-badge-violet">
                  {session.subscription.plan}
                </span>
              )}
            </div>
          </div>

          {/* Section nav buttons */}
          {(["account", "connections", "billing", "guide", "danger"] as SettingsSectionId[]).map((sec) => {
            const isActive = activeSection === sec;
            const isDanger = sec === "danger";
            const icons: Record<SettingsSectionId, ReactNode> = {
              account:     <UserIcon size={14} />,
              connections: <GithubIcon size={14} />,
              billing:     <CreditCardIcon size={14} />,
              guide:       <BookOpenIcon size={14} />,
              danger:      <AlertTriangleIcon size={14} />,
            };
            const stateClass = isActive
              ? isDanger ? "settings-nav-btn--active-danger" : "settings-nav-btn--active"
              : isDanger ? "settings-nav-btn--inactive-danger" : "settings-nav-btn--inactive";
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                aria-current={isActive ? "true" : undefined}
                className={`settings-nav-btn ${stateClass}`}
              >
                {icons[sec]}
                {SECTION_LABELS[sec]}
              </button>
            );
          })}
        </nav>

        {/* Right content */}
        <div
          className="settings-content"
          style={{
            flex: 1,
            minWidth: 0,
            width: isCompactLayout ? "100%" : undefined,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              variants={prefersReducedMotion ? undefined : sectionVariants}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
              exit="exit"
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >

              {/* Account section */}
              {activeSection === "account" && (
                <>
                  {/* Profile header with gradient accent */}
                  <motion.div
                    className="settings-profile-header"
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
                    style={{
                      position: "relative",
                      borderRadius: "1rem",
                      overflow: "hidden",
                      padding: "clamp(1.25rem, 3vw, 1.75rem)",
                    }}
                  >
                    {/* Gradient top bar */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        height: 2,
                        background: "linear-gradient(90deg, var(--brand), var(--accent-violet))",
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                      {/* Avatar with gradient ring */}
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "50%",
                          padding: "2.5px",
                          background: "linear-gradient(135deg, var(--brand), var(--accent-violet))",
                          flexShrink: 0,
                        }}
                      >
                        {session?.user.avatarUrl ? (
                          <Image
                            src={session.user.avatarUrl}
                            alt={session.user.name ?? session.user.login}
                            width={64}
                            height={64}
                            style={{ borderRadius: "50%", display: "block", border: "2px solid var(--bg-base)" }}
                            unoptimized
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            style={{
                              width: "64px",
                              height: "64px",
                              borderRadius: "50%",
                              background: "var(--bg-elevated)",
                              color: "var(--brand)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.5rem",
                              fontWeight: 700,
                              border: "2px solid var(--bg-base)",
                            }}
                          >
                            {avatarInitial}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand)", margin: "0 0 0.25rem" }}>
                          SETTINGS / ACCOUNT
                        </p>
                        <h1 style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, margin: "0 0 0.2rem", letterSpacing: "-0.02em" }}>
                          {session?.user.name ?? session?.user.login ?? "Your account"}
                        </h1>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          {session?.user.login && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "ui-monospace, monospace" }}>
                              <GithubIcon size={13} />
                              @{session.user.login}
                            </span>
                          )}
                          {session?.user.email && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {session.user.email}
                            </span>
                          )}
                          {session?.subscription.plan && (
                            <span className="dash-badge-violet">
                              {session.subscription.plan} plan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Account identity */}
                  <SettingsSection icon={<UserIcon />} title="Account" index={0}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <HoverField label="Display name" value={session?.user.name ?? "-"} editable={false} />
                        <HoverField label="GitHub login" value={`@${session?.user.login ?? "-"}`} editable={false} />
                      </div>
                      {session?.user.email ? (
                        <HoverField label="Email" value={session.user.email} editable={false} />
                      ) : null}
                    </div>
                  </SettingsSection>
                  {workspacesEnabled ? (
                    <SettingsSection icon={<UserIcon />} title="Workspace" index={1}>
                      {workspacesError ? (
                        <p className="error-text" style={{ margin: 0 }}>{workspacesError}</p>
                      ) : workspaces?.items.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {workspaces.items.map((workspace) => (
                            <div key={workspace.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div
                                className={styles.field}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
                              >
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {workspace.name}
                                </span>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                                  {workspace.kind} / {workspace.role}
                                </span>
                              </div>
                              </div>
                              <WorkspaceMembersSection
                                workspace={workspace}
                                currentUserId={session?.user.id ?? ""}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Loading workspace...
                        </p>
                      )}
                    </SettingsSection>
                  ) : null}

                  {notificationsEnabled ? (
                    <SettingsSection icon={<AlertTriangleIcon />} title="Notifications" index={2}>
                      {notificationsError ? (
                        <p className="error-text" style={{ margin: 0 }}>{notificationsError}</p>
                      ) : notifications ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {notifications.unreadCount} unread
                          </span>
                          {notifications.items.length ? (
                            notifications.items.map((notification) => (
                              <div
                                key={notification.id}
                                className={styles.field}
                                style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "min(100%, 560px)" }}>
                                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    {notification.title}
                                  </span>
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                    {notification.body}
                                  </span>
                                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>
                                    {notification.eventCode}
                                  </span>
                                </div>
                                {notification.readAt ? (
                                  <span className="dash-badge-violet">Read</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="dash-action-btn"
                                    disabled={markingNotificationId === notification.id}
                                    onClick={() => void handleMarkNotificationRead(notification.id)}
                                  >
                                    {markingNotificationId === notification.id ? "Saving..." : "Mark read"}
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              No notifications.
                            </p>
                          )}
                          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "0.75rem" }}>
                            <NotificationPreferencesSection />
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Loading notifications...
                        </p>
                      )}
                    </SettingsSection>
                  ) : null}
                </>
              )}

              {/* Connections section */}
              {activeSection === "connections" && (
                <SettingsConnectionsSection />
              )}

              {/* Billing section */}
              {activeSection === "billing" && (
                <SettingsBillingSection
                  cancelMessage={cancelMessage}
                  canManageBilling={canManageBilling}
                  isCanceling={isCanceling}
                  onCancelSubscription={() => void handleCancelSubscription()}
                  onCloseCancelConfirm={() => {
                    setShowCancelConfirm(false);
                    setCancelMessage(null);
                  }}
                  onOpenCancelConfirm={() => setShowCancelConfirm(true)}
                  selectedWorkspaceRole={selectedWorkspaceRole}
                  session={session}
                  showCancelConfirm={showCancelConfirm}
                  usage={usage}
                  usageError={usageError}
                />
              )}

              {/* Guide section */}
              {activeSection === "guide" && (
                <SettingsGuideSection />
              )}

              {/* Danger Zone section */}
              {activeSection === "danger" && (
                <SettingsDangerSection
                  deleteConfirmInput={deleteConfirmInput}
                  deleteMessage={deleteMessage}
                  isDeleting={isDeleting}
                  isLoggingOut={isLoggingOut}
                  logoutMessage={logoutMessage}
                  onArchiveAccount={() => {
                    setShowDeleteConfirm(true);
                    setDeleteMessage(null);
                    setDeleteConfirmInput("");
                  }}
                  onCancelArchive={() => {
                    setShowDeleteConfirm(false);
                    setDeleteMessage(null);
                    setDeleteConfirmInput("");
                  }}
                  onConfirmArchive={() => void handleDeleteAccount()}
                  onLogout={() => void handleLogout()}
                  setDeleteConfirmInput={setDeleteConfirmInput}
                  showDeleteConfirm={showDeleteConfirm}
                  username={session?.user.login}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </DashboardPageContent>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  return (
    <WorkspaceProvider>
      <SettingsPageContent />
    </WorkspaceProvider>
  );
}
