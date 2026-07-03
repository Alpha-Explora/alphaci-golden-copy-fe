import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SettingsBillingSection } from "../../src/features/dashboard/settings/settings-billing-section";
import type { AuthMeResponse, UsageMeResponse, WorkspaceRole } from "../../src/lib/api/contracts";

jest.mock("../../src/components/settings/deployment-providers-section", () => ({
  DeploymentProvidersSection: ({ workspaceRole }: { workspaceRole?: WorkspaceRole | null }) => (
    <div data-testid="providers-section">{workspaceRole ?? "none"}</div>
  ),
}));

const proSession: AuthMeResponse = {
  authenticated: true,
  subscription: {
    plan: "pro",
    status: "active",
    provider: "mock",
    updatedAt: "2026-07-03T00:00:00.000Z",
  },
  user: {
    id: "user-1",
    login: "octo",
    name: "Octo User",
    onboardingCompleted: true,
  },
};

const usage: UsageMeResponse = {
  enabled: true,
  plan: "pro",
  items: [
    {
      code: "workflow_prs",
      current: 4,
      limit: 20,
      upgradeRequired: false,
    },
  ],
};

function renderBillingSection({
  canManageBilling = true,
  isCanceling = false,
  selectedWorkspaceRole = "owner",
  showCancelConfirm = false,
}: {
  canManageBilling?: boolean;
  isCanceling?: boolean;
  selectedWorkspaceRole?: WorkspaceRole | null;
  showCancelConfirm?: boolean;
} = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onCancelSubscription = jest.fn();
  const onCloseCancelConfirm = jest.fn();
  const onOpenCancelConfirm = jest.fn();

  act(() => {
    root.render(
      <SettingsBillingSection
        cancelMessage={null}
        canManageBilling={canManageBilling}
        isCanceling={isCanceling}
        onCancelSubscription={onCancelSubscription}
        onCloseCancelConfirm={onCloseCancelConfirm}
        onOpenCancelConfirm={onOpenCancelConfirm}
        selectedWorkspaceRole={selectedWorkspaceRole}
        session={proSession}
        showCancelConfirm={showCancelConfirm}
        usage={usage}
        usageError={null}
      />,
    );
  });

  return {
    container,
    onCancelSubscription,
    onCloseCancelConfirm,
    onOpenCancelConfirm,
    root,
  };
}

describe("SettingsBillingSection", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("opens cancellation confirmation before calling the cancellation handler", () => {
    const rendered = renderBillingSection();
    root = rendered.root;

    act(() => {
      Array.from(rendered.container.querySelectorAll("button")).find(
        (button) => button.textContent === "Cancel plan",
      )?.click();
    });

    expect(rendered.onOpenCancelConfirm).toHaveBeenCalledTimes(1);
    expect(rendered.onCancelSubscription).not.toHaveBeenCalled();
  });

  it("calls the cancellation handler from the confirmation state", () => {
    const rendered = renderBillingSection({ showCancelConfirm: true });
    root = rendered.root;

    act(() => {
      Array.from(rendered.container.querySelectorAll("button")).find(
        (button) => button.textContent === "Yes, cancel",
      )?.click();
    });

    expect(rendered.onCancelSubscription).toHaveBeenCalledTimes(1);
  });

  it("blocks billing actions for non-managing workspace roles", () => {
    const rendered = renderBillingSection({
      canManageBilling: false,
      selectedWorkspaceRole: "viewer",
      showCancelConfirm: true,
    });
    root = rendered.root;

    const viewPlanLink = rendered.container.querySelector<HTMLAnchorElement>('a[href="#"]');
    const confirmCancelButton = Array.from(rendered.container.querySelectorAll("button")).find(
      (button) => button.textContent === "Yes, cancel",
    );

    expect(rendered.container.textContent).toContain("Billing management requires owner or admin workspace access.");
    expect(viewPlanLink?.getAttribute("aria-disabled")).toBe("true");
    expect(confirmCancelButton?.disabled).toBe(true);
    expect(rendered.container.querySelector('[data-testid="providers-section"]')?.textContent).toBe("viewer");
  });
});
