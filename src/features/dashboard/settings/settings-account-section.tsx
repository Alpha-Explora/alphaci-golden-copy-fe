import Image from "next/image";
import { motion } from "framer-motion";

import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { WorkspaceMembersSection } from "@/components/settings/workspace-members-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuthMeResponse, NotificationsResponse, WorkspacesMeResponse } from "@/lib/api/contracts";

import styles from "./settings-page.module.css";
import { AlertTriangleIcon, GithubIcon, UserIcon } from "./settings-icons";
import { HoverField, SettingsSection } from "./settings-section";

interface SettingsAccountSectionProps {
  avatarInitial: string;
  markingNotificationId: string | null;
  notifications: NotificationsResponse | null;
  notificationsEnabled: boolean;
  notificationsError: string | null;
  onMarkNotificationRead: (id: string) => void;
  prefersReducedMotion: boolean | null;
  session: AuthMeResponse | null;
  workspaces: WorkspacesMeResponse | null;
  workspacesEnabled: boolean;
  workspacesError: string | null;
}

export function SettingsAccountSection({
  avatarInitial,
  markingNotificationId,
  notifications,
  notificationsEnabled,
  notificationsError,
  onMarkNotificationRead,
  prefersReducedMotion,
  session,
  workspaces,
  workspacesEnabled,
  workspacesError,
}: Readonly<SettingsAccountSectionProps>) {
  return (
    <>
      <motion.div
        className={styles.profileHeader}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
      >
        <div aria-hidden="true" className={styles.profileAccentBar} />
        <div className={styles.profileHeaderContent}>
          <div className={styles.avatarRing}>
            {session?.user.avatarUrl ? (
              <Image
                src={session.user.avatarUrl}
                alt={session.user.name ?? session.user.login}
                width={64}
                height={64}
                className={styles.avatarImage}
                unoptimized
              />
            ) : (
              <span aria-hidden="true" className={styles.avatarFallback}>
                {avatarInitial}
              </span>
            )}
          </div>
          <div className={styles.profileText}>
            <p className={styles.accountEyebrow}>SETTINGS / ACCOUNT</p>
            <h1 className={styles.accountTitle}>
              {session?.user.name ?? session?.user.login ?? "Your account"}
            </h1>
            <div className={styles.metaRow}>
              {session?.user.login && (
                <span className={styles.metaItem}>
                  <GithubIcon size={13} />
                  @{session.user.login}
                </span>
              )}
              {session?.user.email && (
                <span className={styles.metaMuted}>
                  {session.user.email}
                </span>
              )}
              {session?.subscription.plan && (
                <Badge tone="accent">
                  {session.subscription.plan} plan
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <SettingsSection icon={<UserIcon />} title="Account" index={0}>
        <div className={styles.sectionStackCompact}>
          <div className={styles.identityGrid}>
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
            <p className={styles.errorText}>{workspacesError}</p>
          ) : workspaces?.items.length ? (
            <div className={styles.sectionStackCompact}>
              {workspaces.items.map((workspace) => (
                <div key={workspace.id} className={styles.workspaceItem}>
                  <div className={`${styles.field} ${styles.fieldSplit}`}>
                    <div className={styles.textStackTight}>
                      <span className={styles.usageValue}>
                        {workspace.name}
                      </span>
                      <span className={styles.workspaceMeta}>
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
            <p className={styles.mutedText}>
              Loading workspace...
            </p>
          )}
        </SettingsSection>
      ) : null}

      {notificationsEnabled ? (
        <SettingsSection icon={<AlertTriangleIcon />} title="Notifications" index={2}>
          {notificationsError ? (
            <p className={styles.errorText}>{notificationsError}</p>
          ) : notifications ? (
            <div className={styles.sectionStackCompact}>
              <span className={styles.primaryText}>
                {notifications.unreadCount} unread
              </span>
              {notifications.items.length ? (
                notifications.items.map((notification) => (
                  <div key={notification.id} className={`${styles.field} ${styles.fieldSplit}`}>
                    <div className={`${styles.textStackTight} ${styles.notificationBody}`}>
                      <span className={styles.usageValue}>
                        {notification.title}
                      </span>
                      <span className={styles.secondaryText}>
                        {notification.body}
                      </span>
                      <span className={styles.notificationEvent}>
                        {notification.eventCode}
                      </span>
                    </div>
                    {notification.readAt ? (
                      <Badge tone="accent">Read</Badge>
                    ) : (
                      <Button
                        disabled={markingNotificationId === notification.id}
                        onClick={() => onMarkNotificationRead(notification.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {markingNotificationId === notification.id ? "Saving..." : "Mark read"}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.mutedText}>
                  No notifications.
                </p>
              )}
              <div className={styles.preferencesWrap}>
                <NotificationPreferencesSection />
              </div>
            </div>
          ) : (
            <p className={styles.mutedText}>
              Loading notifications...
            </p>
          )}
        </SettingsSection>
      ) : null}
    </>
  );
}
