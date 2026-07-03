import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useAppNavData } from "../../src/features/dashboard/app-shell/use-app-nav-data";
import { getNotifications, markNotificationRead } from "../../src/lib/api/notifications";
import { getMyWorkspaces } from "../../src/lib/api/workspaces";

jest.mock("../../src/lib/api/workspaces", () => ({
  getMyWorkspaces: jest.fn(),
}));

jest.mock("../../src/lib/api/notifications", () => ({
  getNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
}));

const setWorkspaces = jest.fn();

jest.mock("../../src/components/layout/workspace-context", () => ({
  useWorkspaceSelection: () => ({ setWorkspaces }),
}));

let latest: ReturnType<typeof useAppNavData> | null = null;

function HookHarness({
  guest,
  onSnapshot,
}: {
  guest: boolean;
  onSnapshot: (snapshot: ReturnType<typeof useAppNavData>) => void;
}) {
  const snapshot = useAppNavData({ guest });
  useEffect(() => {
    onSnapshot(snapshot);
  }, [onSnapshot, snapshot]);
  return null;
}

function render(guest: boolean) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<HookHarness guest={guest} onSnapshot={(snapshot) => { latest = snapshot; }} />);
  });
  return { root };
}

describe("useAppNavData", () => {
  let root: Root | null = null;

  beforeEach(() => {
    latest = null;
    setWorkspaces.mockClear();
    (getMyWorkspaces as jest.Mock).mockResolvedValue({ enabled: true, items: [{ id: "ws-1", name: "Core" }] });
    (getNotifications as jest.Mock).mockResolvedValue({ enabled: true, unreadCount: 1, items: [{ id: "n-1", title: "Ready", body: "Done", eventCode: "build", readAt: null }] });
    (markNotificationRead as jest.Mock).mockResolvedValue({ id: "n-1", read: true });
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("loads workspace and notification data for signed-in users", async () => {
    ({ root } = render(false));

    await act(async () => {
      await Promise.resolve();
    });

    expect(getMyWorkspaces).toHaveBeenCalledTimes(1);
    expect(getNotifications).toHaveBeenCalledTimes(1);
    expect(setWorkspaces).toHaveBeenCalledWith({ enabled: true, items: [{ id: "ws-1", name: "Core" }] });
    expect(latest?.workspaces?.items[0]?.id).toBe("ws-1");
    expect(latest?.notifications?.unreadCount).toBe(1);
  });

  it("does not load data for guests", () => {
    ({ root } = render(true));

    expect(getMyWorkspaces).not.toHaveBeenCalled();
    expect(getNotifications).not.toHaveBeenCalled();
    expect(latest?.workspaces).toBeNull();
    expect(latest?.notifications).toBeNull();
  });

  it("marks notifications as read after mutation", async () => {
    ({ root } = render(false));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await latest?.handleMarkNotificationRead("n-1");
    });

    expect(markNotificationRead).toHaveBeenCalledWith("n-1");
    expect(latest?.notifications?.unreadCount).toBe(0);
    expect(latest?.notifications?.items[0]?.readAt).toEqual(expect.any(String));
  });
});
