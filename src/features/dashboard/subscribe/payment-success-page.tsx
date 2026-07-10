"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Logo } from "@/components/brand";
import { AppNav } from "@/components/layout/app-nav";
import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { SetupFlowSurface } from "@/components/layout/app-shell/setup-flow-surface";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider } from "@/components/layout/workspace-context";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/api/auth";
import { getPaymentIntentStatus } from "@/lib/api/client";
import { isGuest } from "@/lib/auth/subscription";
import { cn } from "@/lib/utils";

type SuccessPlan = "starter" | "growth" | "business";
type PaymentConfirmationStatus = "idle" | "confirming" | "confirmed" | "failed";

const planContent: Record<
  SuccessPlan,
  {
    amount: string;
    message: string;
    planLabel: string;
  }
> = {
  starter: {
    amount: "\u20B1300",
    message:
      "Your Starter plan is active. We've added \u20B1300 in monthly workspace credit that refreshes every month.",
    planLabel: "Starter",
  },
  growth: {
    amount: "Custom",
    message:
      "Your Growth plan is active. Workspace credits and billing limits are now available in your account.",
    planLabel: "Growth",
  },
  business: {
    amount: "Custom",
    message:
      "Your Business plan is active. Assisted onboarding and workspace credits are now available in your account.",
    planLabel: "Business",
  },
};

function getPlan(raw: string | null): SuccessPlan {
  return raw === "growth" || raw === "business" ? raw : "starter";
}

export function UsageCreditCard({ amount }: Readonly<{ amount: string }>) {
  return (
    <article
      className={cn(
        "payment-success-card-pop relative flex aspect-[1.58/1] w-full max-w-[28rem] flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10",
        "bg-[linear-gradient(180deg,#101010_0%,#111827_31%,#0f5ed7_68%,#0ea5e9_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.36)]",
      )}
      aria-label={`${amount} usage credit`}
    >
      <div
        className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(105deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_8px)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2 text-base font-semibold text-white/90">
          <Logo size={18} priority />
          <span>AlphaCI</span>
        </div>
        <strong className="text-[clamp(4rem,18vw,7rem)] font-bold leading-none text-white">
          {amount}
        </strong>
        <span className="text-sm font-semibold text-white/90">Usage credit</span>
      </div>
    </article>
  );
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, status, refresh } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const returnedPaymentIntentId = searchParams.get("payment_intent");
  const [paymentConfirmationStatus, setPaymentConfirmationStatus] = useState<PaymentConfirmationStatus>(
    returnedPaymentIntentId ? "confirming" : "idle",
  );
  const selectedPlan = planContent[getPlan(searchParams.get("plan"))];

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/signup");
    }
  }, [router, status]);

  useEffect(() => {
    if (!returnedPaymentIntentId) {
      if (paymentConfirmationStatus !== "idle") {
        setPaymentConfirmationStatus("idle");
      }
      return;
    }

    if (status !== "signed-in") return;

    let active = true;
    setPaymentConfirmationStatus("confirming");

    void getPaymentIntentStatus(returnedPaymentIntentId)
      .then(async (result) => {
        if (!active) return;

        if (result.subscription) {
          await refresh();
          if (active) setPaymentConfirmationStatus("confirmed");
          return;
        }

        setPaymentConfirmationStatus("failed");
      })
      .catch(() => {
        if (active) setPaymentConfirmationStatus("failed");
      });

    return () => {
      active = false;
    };
  }, [refresh, returnedPaymentIntentId, status]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      await refresh();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (status === "loading") {
    return <PipelineLoader label="Preparing workspace" />;
  }

  if (status === "signed-out") {
    return <PipelineLoader label="Redirecting to sign up" />;
  }

  if (returnedPaymentIntentId && paymentConfirmationStatus === "confirming") {
    return <PipelineLoader label="Confirming payment" />;
  }

  if (returnedPaymentIntentId && paymentConfirmationStatus === "failed") {
    return <PipelineLoader label="We could not confirm your payment yet. Please return to billing and try again." />;
  }

  const guest = isGuest(session);

  return (
    <DashboardShell>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AppNav
        guest={guest}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
        showSidebar={false}
      />
      <DashboardPageContent
        className="place-items-center"
        style={{ padding: "calc(var(--app-header-height, 44px) + 1.5rem) var(--layout-gutter) 3.25rem" }}
      >
        <SetupFlowSurface
          className="min-h-[calc(100dvh-var(--app-header-height,44px)-5rem)] w-full"
          contentClassName="flex min-h-[inherit] w-full items-start justify-center px-5 py-16 text-center sm:px-8 sm:py-20"
        >
          <div className="relative flex w-full max-w-2xl flex-col items-center gap-8">
            <UsageCreditCard amount={selectedPlan.amount} />
            <p className="payment-success-copy-pop m-0 max-w-[34rem] text-balance text-sm leading-6 text-muted-foreground sm:text-base">
              <span className="font-semibold text-foreground">Your {selectedPlan.planLabel} plan is active.</span>{" "}
              {selectedPlan.message.replace(`Your ${selectedPlan.planLabel} plan is active. `, "")}
            </p>
            <Link
              className="payment-success-action-pop inline-flex min-h-10 items-center justify-center rounded-md border border-primary bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/onboarding"
            >
              Get started
            </Link>
          </div>
        </SetupFlowSurface>
      </DashboardPageContent>
    </DashboardShell>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PipelineLoader label="Preparing workspace" />}>
      <WorkspaceProvider>
        <PaymentSuccessContent />
      </WorkspaceProvider>
    </Suspense>
  );
}