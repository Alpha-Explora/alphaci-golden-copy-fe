import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SettingsAccountSection } from "../../src/features/dashboard/settings/settings-account-section";
import type { AuthMeResponse, NotificationsResponse, WorkspacesMeResponse } from "../../src/lib/api/contracts";

jest.mock("../../src/components/settings/workspace-members-section", () => ({
  WorkspaceMembersSection: ({ currentUserId }: { currentUserId: string }) => (
    <div data-testid="members-section">{currentUserId}</div>
  ),
}));

jest.mock("../../src/components/settings/notification-preferences-section", () => ({
  NotificationPreferencesSection: () => <div data-testid="notification-preferences" />,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const session: AuthMeResponse = {
  authenticated: true,
  subscription: {
    plan: "pro",
    status: "active",
    provider: "mock",
    updatedAt: "2026-07-03T00:00:00.000Z",
  },
  user: {
    id: "user-1",
    login: "tone",
    name: "Tone Builder",
    email: "tone@example.test",
    onboardingCompleted: true,
  },
};

const workspaces: WorkspacesMeResponse = {
  enabled: true,
  items: [{ id: "ws-1", name: "Personal workspace", kind: "personal", role: "owner" }],
};

const notifications: NotificationsResponse = {
  enabled: true,
  unreadCount: 1,
  items: [
    {
      id: "notification-1",
      body: "Generated workflow is ready.",
      createdAt: "2026-07-03T00:00:00.000Z",
      eventCode: "workflow_ready",
      projectId: null,
      readAt: null,
      title: "Workflow ready",
    },
  ],
};

function renderAccountSection() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onMarkNotificationRead = jest.fn();

  act(() => {
    root.render(
      <SettingsAccountSection
        avatarInitial="T"
        markingNotificationId={null}
        notifications={notifications}
        notificationsEnabled={true}
        notificationsError={null}
        onMarkNotificationRead={onMarkNotificationRead}
        prefersReducedMotion={false}
        session={session}
        workspaces={workspaces}
        workspacesEnabled={true}
        workspacesError={null}
      />,
    );
  });

  return { container, onMarkNotificationRead, root };
}

describe("SettingsAccountSection", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("renders account workspace and notification sections", () => {
    const rendered = renderAccountSection();
    root = rendered.root;

    expect(rendered.container.textContent).toContain("Tone Builder");
    expect(rendered.container.textContent).toContain("Personal workspace");
    expect(rendered.container.textContent).toContain("1 unread");
    expect(rendered.container.querySelector('[data-testid="members-section"]')?.textContent).toBe("user-1");
    expect(rendered.container.querySelector('[data-testid="notification-preferences"]')).not.toBeNull();
  });

  it("marks unread notifications through the provided handler", () => {
    const rendered = renderAccountSection();
    root = rendered.root;

    act(() => {
      Array.from(rendered.container.querySelectorAll("button")).find(
        (button) => button.textContent === "Mark read",
      )?.click();
    });

    expect(rendered.onMarkNotificationRead).toHaveBeenCalledWith("notification-1");
  });
});
