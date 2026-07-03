"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import styles from "./landing-pricing-section.module.css";

type LandingPricingSectionProps = Readonly<{ reduced?: boolean | null }>;

const heroEase: [number, number, number, number] = [0.25, 1, 0.5, 1];

const featureRows = [
  "Workflow generation",
  "Template access (40+ stacks)",
  "Workflow history",
  "GitHub integration",
  "Managed release lanes",
  "Priority support",
  "Governance defaults",
];

const trustItems = ["Free account included", "Pro monthly", "Team custom"];

export function LandingPricingSection({ reduced = false }: LandingPricingSectionProps) {
  return (
    <section id="pricing" className={styles.section} aria-label="Pricing plans" data-landing-pricing-section="true">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.split}>
        <motion.div
          className={styles.left}
          initial={reduced ? undefined : { opacity: 0, x: -24 }}
          whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: heroEase }}
        >
          <p className={styles.path}>billing/plans.yml</p>
          <div className={styles.badge}>
            <span aria-hidden="true" data-paused={reduced ? "true" : undefined} />
            <span>Plans</span>
          </div>
          <h2>Start free,<br />get Pro when ready.</h2>
          <p className={styles.description}>
            Free gives you room to try AlphaCI. Pro raises your project, deployment, environment, and workflow limits when you are shipping for real.
          </p>
          <div className={styles.priceRow}>
            <span className={styles.price} aria-label="PHP 300 per month">PHP 300</span>
            <span>/ month for Pro</span>
          </div>
          <div className={styles.trustRow}>
            {trustItems.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className={styles.actions}>
            <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link className={styles.primaryAction} href="/subscribe">View plans &rarr;</Link>
            </motion.div>
            <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link className={styles.secondaryAction} href="/home">Start Pro</Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className={styles.right}
          initial={reduced ? undefined : { opacity: 0, x: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: heroEase }}
        >
          <div className={styles.card}>
            <div className={styles.cardAccent} data-paused={reduced ? "true" : undefined} aria-hidden="true" />
            <div className={styles.cardHeader}>
              <div>
                <p>included in pro</p>
                <h3>Everything you need</h3>
              </div>
              <div className={styles.templateBadge}>
                <span>40+</span>
                <span>templates</span>
              </div>
            </div>
            <div role="list" aria-label="Included features">
              {featureRows.map((name, index) => (
                <motion.div
                  key={name}
                  role="listitem"
                  className={styles.featureRow}
                  data-pricing-feature-row="true"
                  initial={reduced ? undefined : { opacity: 0, x: 16 }}
                  whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.25 + index * 0.06, ease: "easeOut" }}
                >
                  <span className={styles.checkIcon} aria-hidden="true"><CheckIcon /></span>
                  <span>{name}</span>
                  <span aria-hidden="true" />
                </motion.div>
              ))}
            </div>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.stackNote}>
              <span>stacks</span>
              <p>Next.js, NestJS, React, Node.js, React Native, Expo, Kotlin, Go, Python, Rust, Vue.js, Svelte - and more.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}