"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";

import { PipelineLogo } from "@/components/layout/pipeline-logo";
import { ActivityStrip, FeatureStripSection, LandingSectionDivider, LandingShell, PipelineShowcaseSection, ReleaseLanesSection, SupportedStacksSection } from "@/features/public-site/landing";

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

/* -- Lusion-style Scroll Progress Line ------------------------------------ */

const SECTION_LABELS = ["01", "02", "03", "04", "05"];

// Sub-component so hooks are called at component level, not inside a callback
function SpineLabel({
  label,
  position,
  progress,
}: Readonly<{ label: string; position: number; progress: MotionValue<number> }>) {
  const lo = Math.max(0, position - 0.15);
  const hi = Math.min(1, position + 0.15);
  const loC = Math.max(0, position - 0.12);
  const hiC = Math.min(1, position + 0.12);

  const labelOpacity = useTransform(progress, [lo, position, hi], [0.2, 0.9, 0.2]);
  const labelColor = useTransform(
    progress,
    [loC, position, hiC],
    ["rgba(255,255,255,0.2)", "rgba(56,189,248,1)", "rgba(255,255,255,0.2)"]
  );

  return (
    <motion.span
      style={{
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        fontFamily: "ui-monospace, monospace",
        lineHeight: 1,
        position: "absolute",
        top: `${position * 100}%`,
        left: "-1.75rem",
        transform: "translateY(-50%)",
        opacity: labelOpacity,
        color: labelColor,
      }}
    >
      {label}
    </motion.span>
  );
}

function ScrollProgressLine({ progress }: Readonly<{ progress: MotionValue<number> }>) {
  // Tighter spring for a more Lusion-like responsive feel
  const scaleY = useSpring(progress, { stiffness: 180, damping: 28, restDelta: 0.0005 });
  const dotTop = useTransform(progress, [0, 1], ["0%", "100%"]);
  const lastIdx = SECTION_LABELS.length - 1;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "clamp(1.5rem, 3vw, 3.5rem)",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        height: "260px",
        pointerEvents: "none",
      }}
    >
      {SECTION_LABELS.map((label, i) => (
        <SpineLabel
          key={label}
          label={label}
          position={i / lastIdx}
          progress={progress}
        />
      ))}
      {/* Track - thin spine */}
      <div
        style={{
          width: "1px",
          height: "100%",
          background: "rgba(255, 255, 255, 0.06)",
          position: "relative",
          borderRadius: "1px",
        }}
      >
        {/* Section tick marks */}
        {SECTION_LABELS.map((label, i) => (
          <div
            key={`tick-${label}`}
            style={{
              position: "absolute",
              left: "50%",
              top: `${(i / lastIdx) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: "3px",
              height: "1px",
              background: "rgba(255,255,255,0.15)",
            }}
          />
        ))}
        {/* Active fill - brand colour gradient */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            background: "linear-gradient(to bottom, var(--brand), rgba(52,211,153,0.7))",
            borderRadius: "1px",
            transformOrigin: "top",
            scaleY,
            height: "100%",
            boxShadow: "0 0 4px rgba(56,189,248,0.4)",
          }}
        />
        {/* Glowing dot at current position */}
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 0 0 2px rgba(56,189,248,0.25), 0 0 10px rgba(56,189,248,0.6), 0 0 20px rgba(56,189,248,0.3)",
            top: dotTop,
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}

/* -- Corner Markers (Lusion viewport frame) ------------------------------- */

function CornerMarkers() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: "none" }}>
      {[
        { top: "1.5rem", left: "1.5rem" },
        { top: "1.5rem", right: "1.5rem" },
        { bottom: "1.5rem", left: "1.5rem" },
        { bottom: "1.5rem", right: "1.5rem" },
      ].map((pos, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            ...pos,
            color: "rgba(255, 255, 255, 0.12)",
            fontSize: "0.85rem",
            fontWeight: 300,
            lineHeight: 1,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          +
        </span>
      ))}
    </div>
  );
}

/* -- Page ------------------------------------------------------------------ */

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const { status, session } = useAuthSession();
  const hasSubscription = hasActiveSubscription(session);

  const heroRef = useRef<HTMLDivElement>(null);

  // Page-level scroll progress bar
  const { scrollYProgress: pageScrollYProgress } = useScroll();

  const massiveTextOpacity = useTransform(pageScrollYProgress, [0, 1], [0.8, 0.2]);
  const massiveTextX = useTransform(pageScrollYProgress, [0, 1], ["0%", "-20%"]);
  const heroContentY = useTransform(pageScrollYProgress, [0, 1], [0, -150]);
  const dashboardY = useTransform(pageScrollYProgress, [0, 0.5], [0, -80]);

  const primaryHref = status === "signed-in" ? (hasSubscription ? "/home" : "/subscribe") : "/signup";
  const primaryLabel = status === "signed-in" ? (hasSubscription ? "Open your workspace" : "View plans") : "Get Started";

  return (
    <LandingShell active="features">
        {/* -- SECTION 1: Asymmetric Split Hero -------------------------------- */}
        <section className="raw-hero-grid" ref={heroRef} aria-label="Main message" style={{ position: "relative", minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", alignContent: "center", padding: "80px clamp(2rem, 7vw, 8rem) 4rem", gap: "4rem", overflow: "hidden" }}>
          <div aria-hidden="true" className="editorial-hero-bg" />

          {/* Massive Background Text */}
          <motion.h1
            className="hero-massive-text"
            aria-hidden="true"
            style={prefersReducedMotion ? { opacity: 0.8 } : {
              opacity: massiveTextOpacity,
              x: massiveTextX
            }}
          >
            ALPHACI ALPHACI ALPHACI
          </motion.h1>

          {/* LEFT COLUMN - Text Content */}
          <motion.div
            className="raw-hero-content"
            style={prefersReducedMotion ? { gridColumn: "1 / 2", gridRow: "1 / 2" } : {
              y: heroContentY,
              position: "relative",
              zIndex: 10,
              textAlign: "left",
              gridColumn: "1 / 2",
              gridRow: "1 / 2"
            }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
            }}
          >
            <motion.div
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, x: -30, filter: "blur(8px)" },
                visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
              }}
              className="hero-system-kicker"
            >
              <span aria-hidden="true" />
              Powered by source-backed templates
            </motion.div>

            <motion.h1
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, y: 60, filter: "blur(12px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1] } }
              }}
              style={{ fontSize: "clamp(2.5rem, 4.5vw, 4.5rem)", letterSpacing: 0, lineHeight: 1.05, marginBottom: "0.75rem", color: "var(--text-primary)", fontWeight: 800 }}
            >
              Ship governed<br/>CI/CD from<br/>one AlphaCI<br/><span style={{ color: "var(--brand)" }}>workspace</span>
            </motion.h1>

            <motion.p
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.25, 1, 0.5, 1] } }
              }}
              style={{ color: "var(--text-secondary)", fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "480px" }}
            >
              AlphaCI turns a repo idea into a working GitHub workflow, protected branch path, and deployment-ready release lane without hand-stitching YAML.
            </motion.p>

            <motion.div
              className="raw-hero-actions"
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } }
              }}
              style={{ display: "flex", gap: "1rem" }}
            >
              <Link className="primary-button" href={primaryHref} style={{ background: "var(--text-primary)", color: "#020617", border: "none", fontWeight: 700, borderRadius: "999px", padding: "0.9rem 2rem", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
                {primaryLabel}
              </Link>
              <Link className="ghost-button hero-ghost-btn" href="mailto:sales@alphaci.dev" style={{ borderRadius: "999px", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.15)", fontWeight: 600, padding: "0.9rem 2rem", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)" }}>
                Contact Sales &gt;
              </Link>
            </motion.div>

            <motion.div
              className="hero-proof-strip"
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] } }
              }}
              aria-label="AlphaCI setup coverage"
            >
              {["GitHub App", "test to uat to main", "Managed release lanes"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="raw-hero-stats"
              variants={prefersReducedMotion ? undefined : {
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
              }}
              style={{ display: "flex", gap: "3rem", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, display: "block" }}>40+</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>Templates</span>
              </div>
              <div>
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--brand)", lineHeight: 1, display: "block", textShadow: "0 0 20px rgba(56,189,248,0.3)" }}>&lt;2m</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>Setup Time</span>
              </div>
              <div>
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--brand-accent)", lineHeight: 1, display: "block", textShadow: "0 0 20px rgba(52,211,153,0.3)" }}>100%</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>Branch Guard</span>
              </div>
            </motion.div>

            {/* Removed Language Badges from here per user request */}
          </motion.div>

          {/* RIGHT COLUMN - Multi-layer floating dashboard */}
          <motion.div
            className="raw-hero-visual"
            style={prefersReducedMotion ? { position: "relative", zIndex: 10, marginTop: "2rem", gridColumn: "2 / 3", gridRow: "1 / 2" } : {
              y: dashboardY,
              position: "relative",
              zIndex: 10,
              marginTop: "2rem",
              gridColumn: "2 / 3",
              gridRow: "1 / 2"
            }}
            initial={prefersReducedMotion ? undefined : { opacity: 0, x: 60, scale: 0.95 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* -- STAGE STATUS FLOATING CARD - top-left, overlapping main card */}
            <motion.div
              className="hero-float-card"
              initial={prefersReducedMotion ? undefined : { opacity: 0, x: -20, y: -10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 2.2, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "absolute",
                top: "-1.25rem",
                left: "-1.5rem",
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "0.75rem 1rem",
                zIndex: 30,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                minWidth: "160px",
              }}
            >
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace", marginBottom: "0.6rem" }}>Pipeline stages</div>
              {[
                { label: "Lint",  color: "#34d399", done: true },
                { label: "Test",  color: "#34d399", done: true },
                { label: "Build", color: "var(--brand)", done: false },
              ].map((stage) => (
                <div key={stage.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: stage.color,
                    boxShadow: `0 0 6px ${stage.color}`,
                    flexShrink: 0,
                    animation: stage.done ? undefined : "flowPulse 1.5s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: stage.done ? "var(--text-secondary)" : "var(--text-primary)", fontFamily: "ui-monospace, monospace" }}>{stage.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: stage.done ? "#34d399" : "var(--brand)", fontWeight: 700 }}>{stage.done ? "OK" : "..."}</span>
                </div>
              ))}
            </motion.div>

            {/* -- MAIN PIPELINE CARD */}
            <div className="hero-main-card" style={{
              position: "relative",
              zIndex: 10,
              background: "rgba(10, 14, 26, 0.72)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "20px",
              padding: "1.75rem",
              boxShadow: "0 32px 96px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(56,189,248,0.05)",
            }}>
              {/* Top gradient accent line */}
              <div aria-hidden="true" style={{
                position: "absolute",
                top: 0,
                left: "10%",
                right: "10%",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.5), rgba(52,211,153,0.3), transparent)",
                borderRadius: "1px",
              }} />

              {/* Card radial glow */}
              <div aria-hidden="true" style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(56,189,248,0.09) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Top bar - with branch chip and commit hash */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", opacity: 0.8 }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308", opacity: 0.8 }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", opacity: 0.8 }} />
                <span className="hero-terminal-brand">
                  <PipelineLogo size={14} />
                  AlphaCI run
                </span>
                {/* Branch chip */}
                <span style={{
                  marginLeft: "0.5rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  borderRadius: "6px",
                  padding: "0.15rem 0.5rem",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "var(--brand)",
                  fontFamily: "ui-monospace, monospace",
                }}>
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>
                  main
                </span>
                {/* Commit hash */}
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>a3f9c12</span>
                {/* Passing badge */}
                <span style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "6px",
                  padding: "0.15rem 0.5rem",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#34d399",
                  fontFamily: "ui-monospace, monospace",
                }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#34d399", display: "inline-block", animation: prefersReducedMotion ? undefined : "flowPulse 2s ease-in-out infinite" }} />
                  passing
                </span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em" }}>pipeline.yml</span>
              </div>

              {/* Animated code lines */}
              {[
                { indent: 0, key: "name",     value: "deploy-production",       delay: 0.8,  highlight: false },
                { indent: 0, key: "trigger",  value: "push to main",          delay: 1.0,  highlight: false },
                { indent: 0, key: "steps",    value: "",                         delay: 1.2,  highlight: false },
                { indent: 1, key: "checkout", value: "v4",                       delay: 1.4,  highlight: false },
                { indent: 1, key: "install",  value: "npm ci",                   delay: 1.6,  highlight: false },
                { indent: 1, key: "lint",     value: "eslint .",                 delay: 1.8,  highlight: false },
                { indent: 1, key: "test",     value: "vitest run",               delay: 2.0,  highlight: false },
                { indent: 1, key: "build",    value: "next build",               delay: 2.2,  highlight: false },
                { indent: 1, key: "deploy",   value: "production",            delay: 2.4,  highlight: true  },
              ].map((line) => (
                <motion.div
                  key={line.key}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: line.delay, ease: [0.25, 1, 0.5, 1] }}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    paddingLeft: `${line.indent * 1.5}rem`,
                    marginBottom: "0.35rem",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.76rem",
                    lineHeight: 1.75,
                    borderRadius: line.highlight ? "4px" : undefined,
                    background: line.highlight ? "rgba(56,189,248,0.05)" : undefined,
                    padding: line.highlight ? "0.1rem 0.4rem 0.1rem " + `${line.indent * 1.5 + 0.4}rem` : `0 0 0 ${line.indent * 1.5}rem`,
                    marginLeft: line.highlight ? "-0.4rem" : undefined,
                    marginRight: line.highlight ? "-0.4rem" : undefined,
                  }}
                >
                  <span style={{ color: line.highlight ? "var(--brand-accent)" : "var(--brand)" }}>{line.key}</span>
                  {line.value && <span style={{ color: "var(--text-muted)" }}>:</span>}
                  {line.value && <span style={{ color: line.highlight ? "#34d399" : "var(--text-secondary)" }}>{line.value}</span>}
                </motion.div>
              ))}

              {/* Pipeline completion progress bar */}
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                transition={{ duration: 0.4, delay: 2.5 }}
                style={{ marginTop: "1.25rem", marginBottom: "0.75rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Pipeline progress</span>
                  <span style={{ fontSize: "0.6rem", color: "var(--brand)", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>82%</span>
                </div>
                <div className="hero-progress-track" style={{ height: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden" }}>
                  <motion.div
                    initial={prefersReducedMotion ? undefined : { width: "0%" }}
                    animate={prefersReducedMotion ? undefined : { width: "82%" }}
                    transition={{ duration: 1.4, delay: 2.7, ease: [0.25, 1, 0.5, 1] }}
                    style={{ height: "100%", background: "linear-gradient(90deg, var(--brand), var(--brand-accent))", borderRadius: "999px", boxShadow: "0 0 8px rgba(56,189,248,0.4)" }}
                  />
                </div>
              </motion.div>

              {/* Deploy target row */}
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.55, ease: [0.25, 1, 0.5, 1] }}
                className="hero-deploy-row"
              style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "0.58rem", fontFamily: "ui-monospace, monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deploy target</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  {/* Release lane marker */}
                  <svg width="10" height="10" viewBox="0 0 116 100" fill="currentColor" aria-hidden="true" className="hero-deploy-vercel-icon">
                    <path d="M57.5 0L115 100H0L57.5 0z"/>
                  </svg>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "ui-monospace, monospace" }}>Production</span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginLeft: "0.1rem" }}>prod</span>
                </span>
              </motion.div>

              {/* Status bar */}
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, scaleX: 0 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: 2.7, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  padding: "0.55rem 1rem",
                  background: "rgba(52, 211, 153, 0.07)",
                  border: "1px solid rgba(52, 211, 153, 0.18)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transformOrigin: "left",
                }}
              >
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.6)" }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>
                  All checks passed &mdash; 2m 14s
                </span>
              </motion.div>
            </div>

            {/* Floating badge - top right, overlapping */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.8, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "absolute",
                top: "-1rem",
                right: "-1rem",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "12px",
                padding: "0.6rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                zIndex: 20,
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand)", animation: "flowPulse 1.8s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--brand)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>Live</span>
            </motion.div>

            {/* Floating metric card - bottom left, overlapping - with sparkline */}
            <motion.div
              className="hero-float-card"
              initial={prefersReducedMotion ? undefined : { opacity: 0, x: -30, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 3.0, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "absolute",
                bottom: "-1.5rem",
                left: "-2rem",
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "1rem 1.25rem",
                zIndex: 20,
                boxShadow: "0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace", marginBottom: "0.3rem" }}>Releases today</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>847</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#34d399" }}>+12.4%</span>
              </div>
              {/* Lane split */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>Auto <span style={{ color: "var(--brand)" }}>521</span></span>
                <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.15)" }}>|</span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>Manual <span style={{ color: "var(--brand-accent)" }}>326</span></span>
              </div>
              {/* Sparkline bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "22px" }} aria-hidden="true">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={prefersReducedMotion ? undefined : { scaleY: 0 }}
                    animate={prefersReducedMotion ? undefined : { scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 3.2 + i * 0.06, ease: "easeOut" }}
                    style={{
                      width: "6px",
                      height: `${h}%`,
                      background: i === 5 ? "var(--brand-accent)" : "rgba(56,189,248,0.3)",
                      borderRadius: "2px",
                      transformOrigin: "bottom",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

        </section>

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
