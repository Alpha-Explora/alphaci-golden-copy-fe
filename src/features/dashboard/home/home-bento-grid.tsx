"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { bentoGridStyles as styles } from "./home-bento-grid.styles";

/* Animated counter hook */

function useCountUp(target: number | null, duration = 900): number | null {
  const [count, setCount] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); }

    if (target === null || target === 0) {
      const safeTarget = target;
      rafRef.current = requestAnimationFrame(() => { setCount(safeTarget); });
      return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }

    const safeTarget = target;
    const start      = performance.now();

    function tick(now: number) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * safeTarget));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

/* Constants */

const quickActions = [
  { cmd: "new-project",    href: "/workflows", display: "Create Project",  shortcut: "Cmd+N", accent: "var(--brand)" },
  { cmd: "view-workflows", href: "/workflows", display: "View Workflows",  shortcut: "Cmd+W", accent: "var(--accent-violet)" },
  { cmd: "manage-plan",    href: "/settings", display: "Manage Plan",     shortcut: "Cmd+P", accent: "var(--accent-teal)" },
];

const pipelineStages = ["Source", "Lint", "Test", "Build", "Deploy"];

const pipelineContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

export const EASE_OUT: [number, number, number, number] = [0.25, 0, 0, 1];

const pipelineDotVariants = {
  hidden:  { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: EASE_OUT } },
};

export const sectionVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT, delay: delay * 0.06 },
  }),
};

export type DashTab = "overview" | "repositories" | "activity";

/* Sub-components */

export function PipelineTrack({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <div>
      <p className="file-path-label" style={{ marginBottom: "0.75rem" }}>pipeline/stages.yml</p>
      <motion.div
        className="pipeline-track"
        aria-label="Pipeline stages"
        variants={reduced ? undefined : pipelineContainerVariants}
        initial={reduced ? undefined : "hidden"}
        animate={reduced ? undefined : "visible"}
      >
        {pipelineStages.map((stage, index) => (
          <span key={stage} style={{ display: "inline-flex", alignItems: "center" }}>
            <motion.span
              className={`pipeline-dot ${index === pipelineStages.length - 1 ? "active" : ""}`}
              variants={reduced ? undefined : pipelineDotVariants}
              title={stage}
              style={{ cursor: "default" }}
            />
            {index < pipelineStages.length - 1 && (
              <motion.span
                className="pipeline-connector"
                variants={reduced ? undefined : pipelineDotVariants}
                aria-hidden="true"
              />
            )}
          </span>
        ))}
      </motion.div>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
        {pipelineStages.map((stage) => (
          <span key={stage} className="template-tag">{stage}</span>
        ))}
      </div>
    </div>
  );
}

function SkeletonValue({ wide = false }: { wide?: boolean }) {
  return (
    <span
      style={{
        display: "block",
        height: "2.5rem",
        width: wide ? "6rem" : "3.5rem",
        background: "var(--bg-elevated)",
        borderRadius: "6px",
        animation: "state-pulse 1.5s infinite",
      }}
    />
  );
}

/* BentoGrid */

interface BentoGridProps {
  historyLoading: boolean;
  projectsLoading: boolean;
  historyLength: number;
  projectsLength: number;
  uniqueServices: number;
  lastActivityValue: string;
  prefersReducedMotion: boolean | null;
}

export function BentoGrid({
  historyLoading,
  projectsLoading,
  historyLength,
  projectsLength,
  uniqueServices,
  lastActivityValue,
  prefersReducedMotion,
}: Readonly<BentoGridProps>) {
  const animatedHistory  = useCountUp(prefersReducedMotion || historyLoading  ? null : historyLength);
  const animatedProjects = useCountUp(prefersReducedMotion || projectsLoading ? null : projectsLength);
  const animatedServices = useCountUp(prefersReducedMotion || historyLoading  ? null : uniqueServices);

  const displayHistory  = prefersReducedMotion ? historyLength  : (animatedHistory  ?? historyLength);
  const displayProjects = prefersReducedMotion ? projectsLength : (animatedProjects ?? projectsLength);
  const displayServices = prefersReducedMotion ? uniqueServices : (animatedServices ?? uniqueServices);

  return (
    <div className={styles.grid}>

      {/* Cell 1: Workflows Generated - dominant brand, asymmetric wide */}
      <div className={cn(styles.card, styles.dominant)}>
        <div className={styles.eyebrow}>
          <span className={cn(styles.pulseDot, styles.pulseDotBrand)} aria-hidden="true" />
          Workflows Generated
        </div>
        <div className={styles.valueRow}>
          <div className={styles.value}>
            {historyLoading ? <SkeletonValue wide /> : displayHistory}
          </div>
          {!historyLoading && historyLength > 0 && (
            <span className={styles.trendUp}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Active
            </span>
          )}
        </div>
        <p className={styles.desc}>GitHub Actions build &amp; test recipes</p>
        <div className={styles.sparkbar} aria-hidden="true">
          {[3,6,4,7,5,8,6,9,7,10,8,11].map((h, i) => (
            <span key={i} className={styles.sparkbarBar} style={{ height: `${h * 8}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      {/* Cell 2: Projects Created - violet tint */}
      <div className={styles.card}>
        <div className={styles.eyebrow}>
          <span className={cn(styles.pulseDot, styles.pulseDotViolet)} aria-hidden="true" />
          Projects
        </div>
        <div className={styles.value}>
          {projectsLoading ? <SkeletonValue /> : displayProjects}
        </div>
        <p className={styles.desc}>Active repositories</p>
        <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      </div>

      {/* Cell 3: Services - teal accent */}
      <div className={styles.card}>
        <div className={styles.eyebrow}>
          <span className={cn(styles.pulseDot, styles.pulseDotTeal)} aria-hidden="true" />
          Services
        </div>
        <div className={styles.value}>
          {historyLoading ? <SkeletonValue /> : displayServices}
        </div>
        <p className={styles.desc}>Unique services</p>
        <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>

      {/* Cell 4: Last Activity - vertical timeline treatment */}
      <div className={styles.card}>
        <div className={styles.eyebrow}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Last Activity
        </div>
        <div className={styles.timeline}>
          <span className={styles.timelineDot} aria-hidden="true" />
          <div className={styles.timelineContent}>
            {historyLoading ? (
              <SkeletonValue wide />
            ) : (
              <span className={styles.timelineDate}>{lastActivityValue}</span>
            )}
            <span className={styles.timelineLabel}>Latest run</span>
          </div>
        </div>
      </div>

      {/* Cell 5: Quick Actions - terminal command rows */}
      <div className={styles.card}>
        <div className={styles.eyebrowSpaced}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Quick actions
        </div>
        <div className={styles.cmdList}>
          {quickActions.map((action) => (
            <Link
              key={action.cmd}
              href={action.href}
              className={styles.cmdRow}
              style={{ "--cmd-accent": action.accent } as CSSProperties}
            >
              <span className={styles.cmdPrompt} aria-hidden="true">$</span>
              <span className={styles.cmdName}>{action.cmd}</span>
              <span className={styles.cmdDisplay}>{action.display}</span>
              <span className={styles.cmdShortcut}>{action.shortcut}</span>
              <svg className={styles.cmdArrow} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
