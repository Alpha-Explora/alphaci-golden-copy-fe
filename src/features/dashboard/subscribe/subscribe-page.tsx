"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { AppNav } from "@/components/layout/app-nav";
import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { FlowBackground } from "@/components/layout/flow-background";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider } from "@/components/layout/workspace-context";
import { SubscriptionCongratsModal } from "@/components/product/subscription-congrats-modal";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  activateMonthlySubscription,
  cancelMonthlySubscription,
  createSubscriptionCheckout,
  getCheckoutStatus,
  logout,
} from "@/lib/api/client";
import { ApiError } from "@/lib/api/request";
import { hasActiveSubscription } from "@/lib/auth/subscription";

import { compareRows, planLimits } from "./subscribe-data";
import { PlanCard } from "./subscribe-plan-card";
import { PublicSubscribePage } from "./subscribe-public-page";
import styles from "./subscribe-page.module.css";

const CONGRATS_SESSION_KEY = "flowci_congrats_shown";
const CHECKOUT_SESSION_KEY = "flowci_paymongo_checkout_id";
const EASE_OUT: [number, number, number, number] = [0.25, 0, 0, 1];

function SubscribePageContent() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const { status, session, error, refresh } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showMockFallback, setShowMockFallback] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(CONGRATS_SESSION_KEY)) {
      setShowCongratsModal(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "signed-in" || searchParams.get("status") !== "success") {
      return;
    }

    const checkoutId =
      typeof window !== "undefined"
        ? sessionStorage.getItem(CHECKOUT_SESSION_KEY)
        : null;

    if (!checkoutId) return;

    const confirmedCheckoutId = checkoutId;
    let active = true;

    async function confirmCheckout() {
      setIsSubmitting(true);
      setActionError(null);

      try {
        const result = await getCheckoutStatus(confirmedCheckoutId);
        if (!active) return;

        if (result.status === "paid") {
          sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
          await refresh();
          setStatusMessage("PayMongo payment confirmed. Pro monthly plan is active.");
          if (!sessionStorage.getItem(CONGRATS_SESSION_KEY)) {
            setShowCongratsModal(true);
          }
          return;
        }

        setStatusMessage(`Checkout status: ${result.status}. Refresh after PayMongo confirms payment.`);
      } catch {
        if (active) {
          setActionError("Could not confirm PayMongo checkout status. Please retry.");
        }
      } finally {
        if (active) setIsSubmitting(false);
      }
    }

    void confirmCheckout();
    return () => {
      active = false;
    };
  }, [refresh, searchParams, status]);

  const hasSubscription = hasActiveSubscription(session);
  const isSignedIn = status === "signed-in";
  const activePlan = hasSubscription ? "pro" : "free";
  const isCurrentPlanActive = activePlan === "pro";
  const currentPlanLabel = activePlan === "pro" ? "Pro Monthly" : "Free";

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutMessage(null);
    try {
      await logout();
      await refresh();
      router.push("/");
    } catch {
      setLogoutMessage("Sign out failed. Please retry.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleActivate() {
    setStatusMessage(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      const checkout = await createSubscriptionCheckout("pro");
      if (!checkout.redirectUrl || !checkout.checkoutId) {
        throw new Error("Checkout session did not include redirect details.");
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(CHECKOUT_SESSION_KEY, checkout.checkoutId);
        window.location.assign(checkout.redirectUrl);
      }
    } catch (checkoutError) {
      const apiError = checkoutError as ApiError;
      if (apiError.status === 503) {
        setActionError("PayMongo checkout is unavailable in this environment.");
        setShowMockFallback(true);
      } else {
        setActionError("Subscription checkout failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  async function handleMockActivate() {
    setStatusMessage(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      await activateMonthlySubscription("pro");
      await refresh();
      setStatusMessage("Pro monthly plan is active. Your workspace is ready.");
      if (typeof window !== "undefined" && !sessionStorage.getItem(CONGRATS_SESSION_KEY)) {
        setShowCongratsModal(true);
      }
    } catch {
      setActionError("Local mock activation is unavailable in this environment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setStatusMessage(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      await cancelMonthlySubscription();
      await refresh();
      setStatusMessage("Monthly subscription canceled.");
    } catch {
      setActionError("Cancel request failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCongratsClose() {
    setShowCongratsModal(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CONGRATS_SESSION_KEY, "1");
    }
  }

  if (status === "loading") {
    return <PipelineLoader label="Loading billing" />;
  }

  if (!isSignedIn) {
    return <PublicSubscribePage error={status === "error" ? error : null} />;
  }

  const freeAction = (
    <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" disabled>
      {activePlan === "free" ? "Current plan" : "Included"}
    </button>
  );

  const proAction = (
    <button
      className={`${styles.button} ${styles.buttonPrimary}`}
      type="button"
      disabled={isSubmitting || isCurrentPlanActive}
      onClick={() => void handleActivate()}
    >
      {isSubmitting ? "Processing..." : isCurrentPlanActive ? "Current plan" : "Get Pro"}
    </button>
  );

  const proSecondaryAction = isSignedIn && isCurrentPlanActive ? (
    <button
      className={`${styles.button} ${styles.buttonSecondary}`}
      type="button"
      disabled={isSubmitting}
      onClick={() => void handleCancel()}
    >
      Cancel subscription
    </button>
  ) : isSignedIn && showMockFallback ? (
    <button
      className={`${styles.button} ${styles.buttonSecondary}`}
      type="button"
      disabled={isSubmitting || isCurrentPlanActive}
      onClick={() => void handleMockActivate()}
    >
      Local mock activate
    </button>
  ) : null;

  return (
    <DashboardShell>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FlowBackground />

      <AppNav
        guest={false}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />

      <DashboardPageContent className={styles.content}>
        <motion.div
          className="workflow-page-header workflow-page-header--compact"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
        >
          <div className="workflow-page-header-left">
            <p className="workflow-page-breadcrumb">
              <span style={{ opacity: 0.55 }}>AlphaCI</span>
              <span className="workflow-page-breadcrumb-sep">/</span>
              <span>Billing</span>
            </p>
            <div className="workflow-page-title-row">
              <h1 className="workflow-page-title">Plans &amp; Billing</h1>
              <div className="workflow-page-studio-badge">
                <span className="workflow-studio-led" aria-hidden="true" />
                {activePlan === "pro" ? "Pro active" : "Free active"}
              </div>
            </div>
          </div>
        </motion.div>

        {logoutMessage && <p className="error-text">{logoutMessage}</p>}

        <section className={styles.accountSummary} aria-label="Current subscription">
          <div>
            <h2>Current plan</h2>
            <p>{currentPlanLabel}</p>
          </div>
          <div>
            <h2>Status</h2>
            <p>{hasSubscription ? "Active paid plan" : "Free account"}</p>
          </div>
          <div>
            <h2>Next action</h2>
            <p>{hasSubscription ? "Manage or cancel anytime" : "Get Pro when you need higher limits"}</p>
          </div>
        </section>

        <section className={styles.grid} aria-label="Subscription plans">
          <PlanCard
            title="Free"
            description="Build and test small projects."
            price="PHP 0"
            period="/ month"
            action={freeAction}
            features={[
              `${planLimits.free.projects} projects`,
              planLimits.free.releaseLanes,
              planLimits.free.targets,
              planLimits.free.env,
              planLimits.free.prs,
            ]}
          />

          <PlanCard
            title="Pro Monthly"
            badge="Recommended"
            description="Ship production workflows with higher limits."
            price="PHP 300"
            period="/ month"
            featured
            action={proAction}
            secondaryAction={proSecondaryAction}
            features={[
              "Everything in Free, and:",
              `${planLimits.pro.projects} projects`,
              planLimits.pro.releaseLanes,
              planLimits.pro.targets,
              planLimits.pro.env,
              planLimits.pro.prs,
            ]}
          />

          <PlanCard
            title="Team"
            description="Shared CI/CD governance for teams."
            price="Custom"
            action={
              <a className={`${styles.button} ${styles.buttonPrimary}`} href="mailto:sales@alphaci.dev">
                Contact us
              </a>
            }
            features={[
              "Workspace roles",
              "Audit history",
              "Shared deployment providers",
              "Higher usage limits",
              "Priority onboarding",
            ]}
          />
        </section>

        {(actionError || statusMessage || error) && (
          <section className={styles.status} aria-live="polite">
            {actionError && <p className={styles.statusError} role="alert">{actionError}</p>}
            {statusMessage && <p>{statusMessage}</p>}
            {error && <p className={styles.statusError}>{error}</p>}
          </section>
        )}

        <section id="compare-limits" className={styles.comparison} aria-labelledby="compare-limits-title">
          <h2 id="compare-limits-title">Compare limits</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Free</th>
                  <th scope="col">Pro</th>
                  <th scope="col">Team</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([feature, free, pro, team]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>{free}</td>
                    <td>{pro}</td>
                    <td>{team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.notes} aria-labelledby="billing-notes-title">
          <div>
            <h2 id="billing-notes-title">Billing notes</h2>
            <p>
              Pro upgrades use PayMongo checkout. In local development, the mock activation button is available when checkout is not configured.
            </p>
          </div>
          <Link className={styles.notesLink} href="/settings">Manage account settings</Link>
        </section>
      </DashboardPageContent>

      {showCongratsModal && (
        <SubscriptionCongratsModal
          planName="Pro Monthly"
          onClose={handleCongratsClose}
        />
      )}
    </DashboardShell>
  );
}

export default function SubscribePage() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<PipelineLoader label="Loading billing" />}>
        <SubscribePageContent />
      </Suspense>
    </WorkspaceProvider>
  );
}
