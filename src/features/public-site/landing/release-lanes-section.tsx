import { motion } from "framer-motion";

import { PipelineLogo } from "@/components/layout/pipeline-logo";

import styles from "./release-lanes-section.module.css";

const RELEASE_STEPS = [
  {
    num: "01",
    label: "Connect target",
    detail: "Connect release targets in settings. AlphaCI keeps release configuration encrypted and attached to the workspace.",
  },
  {
    num: "02",
    label: "Generate workflow",
    detail: "AlphaCI reads your stack, selects a source-backed template, and outputs a GitHub Actions YAML file.",
  },
  {
    num: "03",
    label: "Provision env vars",
    detail: "Environment variables are attached to the release lane automatically during the pipeline run.",
  },
  {
    num: "04",
    label: "Deploy fires on merge",
    detail: "Merge to your target branch and the release step runs through the governed production lane.",
  },
];

const RELEASE_LANES = [
  {
    key: "production",
    labelTone: "neutral",
    title: "Production lane",
    badge: "release production",
    method: "production_lane_ready",
    features: [
      "Token-based authentication",
      "Env vars provisioned per project",
      "Team ID support",
      "Staged production deploys",
    ],
  },
  {
    key: "review",
    labelTone: "accent",
    title: "Review lane",
    badge: "review gated",
    method: "review_lane_ready",
    features: [
      "Branch-connected release lane",
      "Service type + region config",
      "Env vars injected automatically",
      "Multiple release methods",
    ],
  },
];

type ReleaseLanesSectionProps = Readonly<{
  reduced: boolean | null;
}>;

export function ReleaseLanesSection({ reduced }: ReleaseLanesSectionProps) {
  return (
    <section id="deploy" className={styles.section} data-release-lanes-section="true" aria-label="Release lanes">
      <motion.div
        className={styles.header}
        initial={reduced ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
      >
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} data-paused={reduced ? "true" : undefined} aria-hidden="true" />
          <span>Release lanes</span>
        </div>
        <p className={styles.path}>release/lanes.yml</p>
        <h2>Release through governed lanes</h2>
        <p>AlphaCI keeps release targets, environment configuration, and production visibility attached to the generated workflow.</p>
      </motion.div>

      <motion.div
        className={styles.providersRow}
        initial={reduced ? undefined : { opacity: 0, y: 24 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, delay: 0.1 }}
      >
        {RELEASE_LANES.map((lane) => {
          const isReview = lane.key === "review";

          return (
            <div
              key={lane.key}
              className={`${styles.providerCard} ${isReview ? styles.providerCardReview : styles.providerCardProduction}`}
              data-release-lane-card="true"
            >
              <div aria-hidden="true" className={styles.grain} />
              <div className={styles.cardHeader}>
                <span className={`${styles.providerLogo} ${isReview ? styles.providerLogoReview : styles.providerLogoProduction}`} aria-hidden="true">
                  <PipelineLogo size={18} />
                </span>
                <div>
                  <p className={isReview ? styles.cardMetaReview : styles.cardMeta}>Lane</p>
                  <p className={isReview ? styles.cardTitleReview : styles.cardTitle}>{lane.title}</p>
                </div>
                <span className={`${styles.badge} ${isReview ? styles.badgeReview : styles.badgeProduction}`}>{lane.badge}</span>
              </div>

              <ul className={styles.featureList}>
                {lane.features.map((item) => (
                  <li key={item} className={isReview ? styles.featureItemReview : styles.featureItem}>
                    <span className={isReview ? styles.featureDotReview : styles.featureDot} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className={isReview ? styles.methodReview : styles.method}>
                <span className={isReview ? styles.methodLabelReview : styles.methodLabel}>Method</span>
                <code className={isReview ? styles.methodCodeReview : styles.methodCode}>{lane.method}</code>
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        className={styles.stepsRow}
        initial={reduced ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {RELEASE_STEPS.map((step, index) => (
          <motion.div
            key={step.num}
            className={styles.step}
            data-release-step="true"
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
          >
            <span className={styles.stepNum}>{step.num}</span>
            <p className={styles.stepLabel}>{step.label}</p>
            <p className={styles.stepDetail}>{step.detail}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}