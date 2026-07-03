"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll } from "framer-motion";

import { ActivityStrip, FeatureStripSection, HeroSection, LandingSectionDivider, LandingShell, PipelineShowcaseSection, ReleaseLanesSection, SupportedStacksSection } from "@/features/public-site/landing";

import { useAuthSession } from "@/hooks/use-auth-session";
import { hasActiveSubscription } from "@/lib/auth/subscription";

/* -- Data -------------------------------------------------------------------- */

const featureRows = [
  { name: "Workflow generation",         pro: true },
  { name: "Template access (40+ stacks)", pro: true },
  { name: "Workflow history",            pro: true },
  { name: "GitHub integration",          pro: true },
  { name: "Managed release lanes",  pro: true },
  { name: "Priority support",            pro: true },
  { name: "Governance defaults",         pro: true },
];


/* -- Icons ------------------------------------------------------------------- */

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* -- Nav link resolver ----------------------------------------------------- */

/* -- Page ------------------------------------------------------------------ */

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const { status, session } = useAuthSession();
  const hasSubscription = hasActiveSubscription(session);


  // Page-level scroll progress bar
  const { scrollYProgress: pageScrollYProgress } = useScroll();


  const primaryHref = status === "signed-in" ? (hasSubscription ? "/home" : "/subscribe") : "/signup";
  const primaryLabel = status === "signed-in" ? (hasSubscription ? "Open your workspace" : "View plans") : "Get Started";

  return (
    <LandingShell active="features">
        {/* -- SECTION 1: Asymmetric Split Hero -------------------------------- */}
        <HeroSection
          reduced={prefersReducedMotion}
          primaryHref={primaryHref}
          primaryLabel={primaryLabel}
          pageScrollYProgress={pageScrollYProgress}
        />

        <SupportedStacksSection />

        {/* -- SECTION 2: Pipeline visualization -------------------------- */}
        <PipelineShowcaseSection reduced={prefersReducedMotion} />

        <FeatureStripSection reduced={Boolean(prefersReducedMotion)} />

        <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
        {/* -- SECTION 4: Deploy anywhere --------------------------------- */}
        <ReleaseLanesSection reduced={prefersReducedMotion} />

        <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
        {/* -- SECTION 5: Activity strip ---------------------------------- */}
        <ActivityStrip />

        <LandingSectionDivider reduced={Boolean(prefersReducedMotion)} />
        {/* -- SECTION 6: Pricing ----------------------------------------- */}
        <section
          id="pricing"
          className="pricing-section section-glow-center"
          aria-label="Pricing plans"
        >
          <div className="pricing-split">

            {/* LEFT - Headline, price hero, CTA */}
            <motion.div
              className="pricing-split-left"
              initial={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              {/* Section label */}
              <p className="file-path-label" style={{ marginBottom: "1.5rem" }}>billing/plans.yml</p>

              {/* Plan badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(52,211,153,0.08))", border: "1px solid rgba(56,189,248,0.22)", marginBottom: "1.75rem", width: "fit-content" }}>
                <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand-accent)", animation: prefersReducedMotion ? undefined : "flowPulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--brand)", fontFamily: "ui-monospace, monospace" }}>Plans</span>
              </div>

              {/* Main heading */}
              <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem", color: "var(--text-primary)" }}>
                Start free,<br />get Pro when ready.
              </h2>

              <p style={{ color: "var(--text-secondary)", fontSize: "clamp(0.9rem, 1.2vw, 1.05rem)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "44ch" }}>
                Free gives you room to try AlphaCI. Pro raises your project, deployment, environment, and workflow limits when you are shipping for real.
              </p>

              {/* Hero price display */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span
                  className="pricing-hero-price"
                  aria-label="PHP 300 per month"
                >
                  PHP 300
                </span>
                <span style={{ fontSize: "clamp(0.85rem, 1.2vw, 1rem)", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>/ month for Pro</span>
              </div>

              {/* Trust micro-copy */}
              <div className="pricing-trust-row" style={{ marginBottom: "2.5rem" }}>
                {["Free account included", "Pro monthly", "Team custom"].map((item) => (
                  <span key={item} className="pricing-trust-item">{item}</span>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    className="primary-button pricing-view-plans-btn"
                    href="/subscribe"
                    style={{ background: "var(--text-primary)", color: "#020617", border: "none", fontWeight: 700, borderRadius: "999px", padding: "0.9rem 2.25rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.8rem" }}
                  >
                    View plans &rarr;
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    className="ghost-button"
                    href="/home"
                    style={{ borderRadius: "999px", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.15)", fontWeight: 600, padding: "0.9rem 2rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontSize: "0.8rem", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)" }}
                  >
                    Start Pro
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* RIGHT - Feature checklist glass card */}
            <motion.div
              className="pricing-split-right"
              initial={prefersReducedMotion ? undefined : { opacity: 0, x: 24 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="pricing-split-card">
                {/* Animated gradient top border */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent 0%, var(--brand) 30%, var(--brand-accent) 70%, transparent 100%)",
                    animation: prefersReducedMotion ? undefined : "gradient-shift 4s linear infinite",
                    backgroundSize: "200% 100%",
                    borderRadius: "1.5rem 1.5rem 0 0",
                  }}
                />

                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", marginBottom: "0.35rem" }}>
                      included in pro
                    </p>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                      Everything you need
                    </h3>
                  </div>
                  {/* 40+ templates badge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--brand)", lineHeight: 1, textShadow: "0 0 20px rgba(56,189,248,0.3)" }}>40+</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>templates</span>
                  </div>
                </div>

                {/* Feature rows */}
                <div role="list" aria-label="Included features">
                  {featureRows.map((row, i) => (
                    <motion.div
                      key={row.name}
                      role="listitem"
                      className="pricing-feature-row"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, x: 16 }}
                      whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.25 + i * 0.06, ease: "easeOut" }}
                    >
                      <span className="pricing-check-icon" aria-hidden="true">
                        <CheckIcon />
                      </span>
                      <span style={{ fontSize: "0.92rem", color: "var(--text-secondary)", flex: 1 }}>{row.name}</span>
                      <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(52,211,153,0.4)", flexShrink: 0 }} />
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div aria-hidden="true" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", margin: "1.75rem 0" }} />

                {/* Stack support note */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", paddingTop: "0.1rem", flexShrink: 0 }}>
                    stacks
                  </span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Next.js, NestJS, React, Node.js, React Native, Expo, Kotlin, Go, Python, Rust, Vue.js, Svelte - and more.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>
    </LandingShell>
  );
}
