import { DeploymentProvidersSection } from "@/components/settings/deployment-providers-section";
import { Button, ButtonLink } from "@/components/ui/button";
import type { AuthMeResponse, UsageMeResponse, WorkspaceRole } from "@/lib/api/contracts";

import styles from "./settings-page.module.css";
import { CreditCardIcon, ExternalLinkIcon } from "./settings-icons";
import { SettingsSection } from "./settings-section";

interface SettingsBillingSectionProps {
  canManageBilling: boolean;
  cancelMessage: string | null;
  isCanceling: boolean;
  onCancelSubscription: () => void;
  onCloseCancelConfirm: () => void;
  onOpenCancelConfirm: () => void;
  selectedWorkspaceRole: WorkspaceRole | null;
  session: AuthMeResponse | null;
  showCancelConfirm: boolean;
  usage: UsageMeResponse | null;
  usageError: string | null;
}

function formatPlanName(plan: string) {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SettingsBillingSection({
  canManageBilling,
  cancelMessage,
  isCanceling,
  onCancelSubscription,
  onCloseCancelConfirm,
  onOpenCancelConfirm,
  selectedWorkspaceRole,
  session,
  showCancelConfirm,
  usage,
  usageError,
}: Readonly<SettingsBillingSectionProps>) {
  const subscription = session?.subscription;

  return (
    <>
      <SettingsSection icon={<CreditCardIcon />} title="Billing" index={0}>
        <div className={styles.sectionStack}>
          <div className={styles.splitRow}>
            <div className={styles.textStack}>
              <span className={styles.primaryText}>
                {subscription?.plan ? formatPlanName(subscription.plan) : "No active plan"}
              </span>
              {subscription?.status && (
                <span className={subscription.status === "active" ? styles.activeStatusText : styles.mutedStatusText}>
                  Status: {subscription.status}
                </span>
              )}
            </div>
            <ButtonLink
              href={canManageBilling ? "/subscribe" : "#"}
              size="sm"
              variant="ghost"
              aria-disabled={!canManageBilling}
              onClick={(event) => {
                if (!canManageBilling) event.preventDefault();
              }}
              trailingIcon={<ExternalLinkIcon size={11} />}
            >
              View plan
            </ButtonLink>
          </div>
          {!canManageBilling ? (
            <p className="helper-text" style={{ margin: 0 }}>
              Billing management requires owner or admin workspace access.
            </p>
          ) : null}

          {subscription?.plan === "pro" && subscription.status === "active" && (
            <div className={cx(styles.sectionDivider, styles.sectionStackCompact)}>
              {!showCancelConfirm ? (
                <div className={styles.splitRow}>
                  <div className={styles.textStackTight}>
                    <span className={styles.primaryText}>Cancel subscription</span>
                    <span className={styles.fineMutedText}>Your access will remain active until the end of the billing period.</span>
                  </div>
                  <Button
                    disabled={!canManageBilling}
                    onClick={onOpenCancelConfirm}
                    size="sm"
                    style={{ borderRadius: "0.5rem" }}
                    variant="danger"
                  >
                    Cancel plan
                  </Button>
                </div>
              ) : (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmTitle}>
                    Are you sure you want to cancel your Pro subscription?
                  </p>
                  <p className={styles.fineMutedText}>
                    You will lose access to Pro features at the end of your current billing period. This action can be undone by resubscribing.
                  </p>
                  <div className={styles.buttonRow}>
                    <Button
                      disabled={isCanceling || !canManageBilling}
                      onClick={onCancelSubscription}
                      size="sm"
                      style={{ borderRadius: "0.5rem" }}
                      variant="danger"
                    >
                      {isCanceling ? "Canceling..." : "Yes, cancel"}
                    </Button>
                    <Button
                      disabled={isCanceling}
                      onClick={onCloseCancelConfirm}
                      size="sm"
                      style={{ borderRadius: "0.5rem" }}
                      variant="ghost"
                    >
                      Keep plan
                    </Button>
                  </div>
                </div>
              )}
              {cancelMessage && (
                <p className={cancelMessage.startsWith("Failed") ? styles.messageDanger : styles.messageSuccess}>
                  {cancelMessage}
                </p>
              )}
            </div>
          )}

          <div className={cx(styles.sectionDivider, styles.sectionStackCompact)}>
            <span className={styles.primaryText}>
              Usage
            </span>
            {usageError ? (
              <p className={styles.errorText}>{usageError}</p>
            ) : usage ? (
              <div className={styles.usageGrid}>
                {usage.items.map((item) => (
                  <div key={item.code} className={styles.field}>
                    <span className={styles.usageLabel}>
                      {item.code.replaceAll("_", " ")}
                    </span>
                    <span className={cx(styles.usageValue, item.upgradeRequired && styles.usageValueDanger)}>
                      {item.current} / {item.limit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.mutedText}>
                Loading usage...
              </p>
            )}
          </div>
        </div>
      </SettingsSection>
      <DeploymentProvidersSection workspaceRole={selectedWorkspaceRole} />
    </>
  );
}
