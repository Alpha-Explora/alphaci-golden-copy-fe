"use client";

import { useReducedMotion, useScroll } from "framer-motion";

import {
  ActivityStrip,
  FeatureStripSection,
  HeroSection,
  LandingPricingSection,
  LandingSectionDivider,
  LandingShell,
  PipelineShowcaseSection,
  ReleaseLanesSection,
  SupportedStacksSection,
} from "@/features/public-site/landing";
import { useAuthSession } from "@/hooks/use-auth-session";
import { hasActiveSubscription } from "@/lib/auth/subscription";

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const { status, session } = useAuthSession();
  const hasSubscription = hasActiveSubscription(session);
  const { scrollYProgress: pageScrollYProgress } = useScroll();

  const primaryHref = status === "signed-in" ? (hasSubscription ? "/home" : "/subscribe") : "/signup";
  const primaryLabel = status === "signed-in" ? (hasSubscription ? "Open your workspace" : "View plans") : "Get Started";

  return (
    <LandingShell active="features">
      <HeroSection
        reduced={prefersReducedMotion}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        pageScrollYProgress={pageScrollYProgress}
      />
      <SupportedStacksSection />
      <PipelineShowcaseSection reduced={prefersReducedMotion} />
      <FeatureStripSection reduced={Boolean(prefersReducedMotion)} />
      <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
      <ReleaseLanesSection reduced={prefersReducedMotion} />
      <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
      <ActivityStrip />
      <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
      <LandingPricingSection reduced={prefersReducedMotion} />
    </LandingShell>
  );
}