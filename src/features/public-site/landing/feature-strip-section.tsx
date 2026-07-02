import { motion } from "framer-motion";

import styles from "./feature-strip-section.module.css";

type FeatureIconType = "gen" | "cicd" | "agnt";
type FeatureTone = "brand" | "accent";

interface FeatureCard {
  icon: FeatureIconType;
  eyebrow: string;
  title: string;
  body: string;
  tone: FeatureTone;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: "gen",
    eyebrow: "features/generation",
    title: "Source-backed generation",
    body: "Templates are mapped to real source files in your repo. AlphaCI reads your stack and generates YAML that actually matches your project - not a boilerplate copy-paste.",
    tone: "brand",
  },
  {
    icon: "cicd",
    eyebrow: "features/automation",
    title: "Guided setup to export",
    body: "Configure your service in three tabs: choose a template, set environment variables, and export production-ready GitHub Actions YAML. No manual editing required.",
    tone: "accent",
  },
  {
    icon: "agnt",
    eyebrow: "features/deployment",
    title: "Release through governed lanes",
    body: "Connect release targets once. AlphaCI keeps environment variables and production release visibility tied to the generated pipeline.",
    tone: "brand",
  },
];

function GenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CicdIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49M4.93 4.93a10 10 0 0 0 0 14.14M7.76 7.76a6 6 0 0 0 0 8.49" />
    </svg>
  );
}

function AgntIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function FeatureIcon({ type }: Readonly<{ type: FeatureIconType }>) {
  if (type === "gen") return <GenIcon />;
  if (type === "cicd") return <CicdIcon />;
  return <AgntIcon />;
}

interface FeatureStripSectionProps {
  reduced?: boolean;
}

export function FeatureStripSection({ reduced = false }: Readonly<FeatureStripSectionProps>) {
  return (
    <section className={styles.section} aria-label="Key features" data-feature-strip-section="true">
      {FEATURE_CARDS.map((card, index) => (
        <motion.div
          key={card.title}
          className={styles.card}
          data-feature-card="true"
          data-tone={card.tone}
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          whileHover={reduced ? undefined : { y: -8, scale: 1.02 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: index * 0.12, duration: 0.4 }}
        >
          <div className={styles.corner} aria-hidden="true" />
          <span className={styles.number}>0{index + 1}</span>
          <span className={styles.icon} aria-hidden="true">
            <FeatureIcon type={card.icon} />
          </span>
          <div>
            <p className={styles.eyebrow}>{card.eyebrow}</p>
            <h3>{card.title}</h3>
          </div>
          <p>{card.body}</p>
        </motion.div>
      ))}
    </section>
  );
}
