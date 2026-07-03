"use client";

import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import type { MotionValue, Variants } from "framer-motion";

import { PipelineLogo } from "@/components/layout/pipeline-logo";

import styles from "./hero-section.module.css";
import visualStyles from "./hero-visual.module.css";

const heroStyles: Record<string, string> = { ...styles, ...visualStyles };

type HeroSectionProps = Readonly<{
  reduced: boolean | null;
  primaryHref: string;
  primaryLabel: string;
  pageScrollYProgress: MotionValue<number>;
}>;

const stageStatuses = [
  { label: "Lint", color: "#34d399", done: true },
  { label: "Test", color: "#34d399", done: true },
  { label: "Build", color: "var(--brand)", done: false },
];

const proofItems = ["GitHub App", "test to uat to main", "Managed release lanes"];
const sparkBars = [40, 65, 50, 80, 55, 90, 70];

const codeLines = [
  { indent: 0, key: "name", value: "deploy-production", delay: 0.8, highlight: false },
  { indent: 0, key: "trigger", value: "push to main", delay: 1, highlight: false },
  { indent: 0, key: "steps", value: "", delay: 1.2, highlight: false },
  { indent: 1, key: "checkout", value: "v4", delay: 1.4, highlight: false },
  { indent: 1, key: "install", value: "npm ci", delay: 1.6, highlight: false },
  { indent: 1, key: "lint", value: "eslint .", delay: 1.8, highlight: false },
  { indent: 1, key: "test", value: "vitest run", delay: 2, highlight: false },
  { indent: 1, key: "build", value: "next build", delay: 2.2, highlight: false },
  { indent: 1, key: "deploy", value: "production", delay: 2.4, highlight: true },
];

const heroEase: [number, number, number, number] = [0.25, 1, 0.5, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -30, filter: "blur(8px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: heroEase } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: heroEase } },
};

export function HeroSection({ reduced, primaryHref, primaryLabel, pageScrollYProgress }: HeroSectionProps) {
  const massiveTextOpacity = useTransform(pageScrollYProgress, [0, 1], [0.8, 0.2]);
  const massiveTextX = useTransform(pageScrollYProgress, [0, 1], ["0%", "-20%"]);
  const heroContentY = useTransform(pageScrollYProgress, [0, 1], [0, -150]);
  const dashboardY = useTransform(pageScrollYProgress, [0, 0.5], [0, -80]);

  return (
    <section className={heroStyles.section} aria-label="Main message" data-landing-hero-section="true">
      <div aria-hidden="true" className={heroStyles.background} />
      <motion.h1 className={heroStyles.massiveText} aria-hidden="true" style={reduced ? { opacity: 0.8 } : { opacity: massiveTextOpacity, x: massiveTextX }}>
        ALPHACI ALPHACI ALPHACI
      </motion.h1>

      <motion.div
        className={heroStyles.content}
        style={reduced ? undefined : { y: heroContentY }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={reduced ? undefined : fadeLeft} className={heroStyles.kicker}>
          <span aria-hidden="true" />
          Powered by source-backed templates
        </motion.div>

        <motion.h1 variants={reduced ? undefined : fadeUp} className={heroStyles.title}>
          Ship governed<br />CI/CD from<br />one AlphaCI<br /><span>workspace</span>
        </motion.h1>

        <motion.p variants={reduced ? undefined : fadeUp} className={heroStyles.description}>
          AlphaCI turns a repo idea into a working GitHub workflow, protected branch path, and deployment-ready release lane without hand-stitching YAML.
        </motion.p>

        <motion.div className={heroStyles.actions} variants={reduced ? undefined : fadeUp}>
          <Link className={heroStyles.primaryAction} href={primaryHref}>{primaryLabel}</Link>
          <Link className={heroStyles.secondaryAction} href="mailto:sales@alphaci.dev">Contact Sales &gt;</Link>
        </motion.div>

        <motion.div className={heroStyles.proofStrip} variants={reduced ? undefined : fadeUp} aria-label="AlphaCI setup coverage">
          {proofItems.map((item) => <span key={item}>{item}</span>)}
        </motion.div>

        <motion.div className={heroStyles.stats} variants={reduced ? undefined : fadeUp}>
          <HeroStat value="40+" label="Templates" tone="default" />
          <HeroStat value="<2m" label="Setup Time" tone="brand" />
          <HeroStat value="100%" label="Branch Guard" tone="accent" />
        </motion.div>
      </motion.div>

      <motion.div
        className={heroStyles.visual}
        style={reduced ? undefined : { y: dashboardY }}
        initial={reduced ? undefined : { opacity: 0, x: 60, scale: 0.95 }}
        animate={reduced ? undefined : { opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.6, ease: heroEase }}
      >
        <StageCard reduced={reduced} />
        <MainPipelineCard reduced={reduced} />
        <LiveBadge reduced={reduced} />
        <MetricCard reduced={reduced} />
      </motion.div>
    </section>
  );
}

function HeroStat({ value, label, tone }: Readonly<{ value: string; label: string; tone: "default" | "brand" | "accent" }>) {
  return (
    <div className={heroStyles.stat}>
      <span className={styles[`statValue${tone[0].toUpperCase()}${tone.slice(1)}`]}>{value}</span>
      <span className={heroStyles.statLabel}>{label}</span>
    </div>
  );
}

function StageCard({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div className={heroStyles.stageCard} initial={reduced ? undefined : { opacity: 0, x: -20, y: -10 }} animate={reduced ? undefined : { opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.6, delay: 2.2, ease: heroEase }}>
      <div className={heroStyles.floatCardLabel}>Pipeline stages</div>
      {stageStatuses.map((stage) => (
        <div key={stage.label} className={heroStyles.stageRow}>
          <span className={heroStyles.stageDot} style={{ "--stage-color": stage.color } as React.CSSProperties} data-paused={stage.done || reduced ? "true" : undefined} />
          <span className={stage.done ? heroStyles.stageTextDone : heroStyles.stageTextActive}>{stage.label}</span>
          <span className={stage.done ? heroStyles.stageStateDone : heroStyles.stageStateActive}>{stage.done ? "OK" : "..."}</span>
        </div>
      ))}
    </motion.div>
  );
}

function MainPipelineCard({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <div className={heroStyles.mainCard}>
      <div aria-hidden="true" className={heroStyles.cardAccent} />
      <div aria-hidden="true" className={heroStyles.cardGlow} />
      <div className={heroStyles.terminalBar}>
        <span className={heroStyles.dotRed} aria-hidden="true" />
        <span className={heroStyles.dotYellow} aria-hidden="true" />
        <span className={heroStyles.dotGreen} aria-hidden="true" />
        <span className={heroStyles.terminalBrand}><PipelineLogo size={14} />AlphaCI run</span>
        <span className={heroStyles.branchChip}><BranchIcon />main</span>
        <span className={heroStyles.commitHash}>a3f9c12</span>
        <span className={heroStyles.passingBadge}><span data-paused={reduced ? "true" : undefined} />passing</span>
        <span className={heroStyles.fileName}>pipeline.yml</span>
      </div>

      <div className={heroStyles.codeBlock}>
        {codeLines.map((line) => <CodeLine key={line.key} line={line} reduced={reduced} />)}
      </div>

      <ProgressBlock reduced={reduced} />
      <DeployTargetRow reduced={reduced} />
      <motion.div className={heroStyles.statusBar} initial={reduced ? undefined : { opacity: 0, scaleX: 0 }} animate={reduced ? undefined : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.8, delay: 2.7, ease: heroEase }}>
        <span aria-hidden="true" />
        <span>All checks passed - 2m 14s</span>
      </motion.div>
    </div>
  );
}

function CodeLine({ line, reduced }: Readonly<{ line: (typeof codeLines)[number]; reduced: boolean | null }>) {
  const indentClass = line.indent === 1 ? heroStyles.codeLineIndent : "";
  return (
    <motion.div
      className={`${heroStyles.codeLine} ${indentClass} ${line.highlight ? heroStyles.codeLineHighlight : ""}`}
      initial={reduced ? undefined : { opacity: 0, x: 20 }}
      animate={reduced ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: line.delay, ease: heroEase }}
    >
      <span className={line.highlight ? heroStyles.codeKeyHighlight : heroStyles.codeKey}>{line.key}</span>
      {line.value && <span className={heroStyles.codeColon}>:</span>}
      {line.value && <span className={line.highlight ? heroStyles.codeValueHighlight : heroStyles.codeValue}>{line.value}</span>}
    </motion.div>
  );
}

function ProgressBlock({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div className={heroStyles.progressBlock} initial={reduced ? undefined : { opacity: 0 }} animate={reduced ? undefined : { opacity: 1 }} transition={{ duration: 0.4, delay: 2.5 }}>
      <div className={heroStyles.progressLabelRow}>
        <span>Pipeline progress</span>
        <span>82%</span>
      </div>
      <div className={heroStyles.progressTrack}>
        <motion.div initial={reduced ? undefined : { width: "0%" }} animate={reduced ? undefined : { width: "82%" }} transition={{ duration: 1.4, delay: 2.7, ease: heroEase }} />
      </div>
    </motion.div>
  );
}

function DeployTargetRow({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div className={heroStyles.deployRow} initial={reduced ? undefined : { opacity: 0, y: 8 }} animate={reduced ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.55, ease: heroEase }}>
      <span>Deploy target</span>
      <span>
        <svg width="10" height="10" viewBox="0 0 116 100" fill="currentColor" aria-hidden="true"><path d="M57.5 0L115 100H0L57.5 0z" /></svg>
        <strong>Production</strong>
        <em>prod</em>
      </span>
    </motion.div>
  );
}

function LiveBadge({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div className={heroStyles.liveBadge} initial={reduced ? undefined : { opacity: 0, scale: 0.8, y: 20 }} animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 2.8, ease: heroEase }}>
      <span data-paused={reduced ? "true" : undefined} aria-hidden="true" />
      <span>Live</span>
    </motion.div>
  );
}

function MetricCard({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div className={heroStyles.metricCard} initial={reduced ? undefined : { opacity: 0, x: -30, y: 20 }} animate={reduced ? undefined : { opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.7, delay: 3, ease: heroEase }}>
      <div className={heroStyles.floatCardLabel}>Releases today</div>
      <div className={heroStyles.metricRow}><span>847</span><span>+12.4%</span></div>
      <div className={heroStyles.laneSplit}>
        <span>Auto <strong>521</strong></span>
        <span>|</span>
        <span>Manual <strong>326</strong></span>
      </div>
      <div className={heroStyles.sparkline} aria-hidden="true">
        {sparkBars.map((height, index) => (
          <motion.div key={height + index} initial={reduced ? undefined : { scaleY: 0 }} animate={reduced ? undefined : { scaleY: 1 }} transition={{ duration: 0.4, delay: 3.2 + index * 0.06, ease: "easeOut" }} style={{ height: `${height}%` }} data-accent={index === 5 ? "true" : undefined} />
        ))}
      </div>
    </motion.div>
  );
}

function BranchIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
    </svg>
  );
}
