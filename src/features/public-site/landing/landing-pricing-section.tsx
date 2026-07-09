"use client";

import Link from "next/link";
import { motion } from "framer-motion";


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

const styles = {
  section: "relative overflow-hidden bg-[var(--bg-base)] px-[clamp(2rem,7vw,8rem)] py-[clamp(4rem,6vw,6rem)]",
  topGlow:
    "pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(79,142,255,0.06)_0%,transparent_65%)]",
  glow:
    "pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(79,142,255,0.06)_0%,transparent_65%)]",
  split: "relative z-[1] grid w-full grid-cols-2 items-start gap-[clamp(3rem,6vw,7rem)] max-[860px]:grid-cols-1 max-[860px]:gap-12",
  left: "flex flex-col",
  path: "mb-6 mt-0 font-mono text-[0.68rem] tracking-[0.04em] text-[var(--brand)]",
  badge:
    "mb-7 inline-flex w-fit items-center gap-[0.4rem] rounded-full border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(52,211,153,0.08))] px-3 py-1",
  badgeDot: "size-[5px] rounded-full bg-[var(--brand-accent)]",
  badgeText: "font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--brand)]",
  heading: "mb-4 mt-0 text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.1] tracking-normal text-[var(--text-primary)]",
  description: "mb-10 mt-0 max-w-[44ch] text-[clamp(0.9rem,1.2vw,1.05rem)] leading-[1.7] text-[var(--text-secondary)]",
  priceRow: "mb-2 flex flex-wrap items-baseline gap-3",
  price:
    "bg-[linear-gradient(135deg,var(--text-primary)_0%,var(--brand)_60%,var(--brand-accent)_100%)] bg-clip-text font-[Sora,var(--font-display),sans-serif] text-[clamp(5rem,10vw,9rem)] font-extrabold leading-none tracking-normal text-[var(--text-primary)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] max-[860px]:text-[clamp(4rem,18vw,7rem)]",
  priceMeta: "font-mono text-[clamp(0.85rem,1.2vw,1rem)] tracking-[0.04em] text-[var(--text-muted)]",
  trustRow: "mb-10 flex flex-wrap items-center gap-3",
  trustItem: "inline-flex items-center gap-[0.4rem] font-mono text-[0.72rem] tracking-[0.04em] text-[var(--text-muted)]",
  trustDot: "size-1 shrink-0 rounded-full bg-[var(--text-muted)]",
  actions: "flex flex-wrap gap-4",
  primaryAction:
    "inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-[var(--text-primary)] px-9 py-[0.9rem] text-[0.8rem] font-bold uppercase leading-none tracking-[0.1em] text-[#020617] no-underline",
  secondaryAction:
    "inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-8 py-[0.9rem] text-[0.8rem] font-semibold uppercase leading-none tracking-[0.1em] text-[var(--text-primary)] no-underline backdrop-blur-[10px]",
  right: "relative",
  card:
    "relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0a0e1a]/70 p-[clamp(2rem,3vw,3rem)] shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.04)] backdrop-blur-3xl transition-[border-color,box-shadow] duration-300 ease-in-out hover:border-cyan-400/35 hover:shadow-[0_32px_100px_rgba(0,0,0,0.6),0_0_80px_rgba(56,189,248,0.08),inset_0_0_0_0.5px_rgba(255,255,255,0.06)]",
  cardAccent:
    "absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-[linear-gradient(90deg,transparent_0%,var(--brand)_30%,var(--brand-accent)_70%,transparent_100%)] bg-[length:200%_100%]",
  cardHeader: "mb-8 flex items-center justify-between gap-4",
  cardMeta: "mb-[0.35rem] mt-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]",
  cardTitle: "m-0 text-[1.15rem] font-bold tracking-normal text-[var(--text-primary)]",
  templateBadge: "flex flex-col items-end gap-[0.2rem]",
  templateCount: "text-[1.6rem] font-extrabold leading-none text-[var(--brand)] [text-shadow:0_0_20px_rgba(56,189,248,0.3)]",
  templateLabel: "font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]",
  featureRow: "flex items-center gap-[0.85rem] border-b border-white/[0.04] py-[0.85rem] first:pt-0 last:border-b-0 last:pb-0",
  checkIcon: "inline-flex size-[1.35rem] shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[var(--success)]",
  featureName: "flex-1 text-[0.92rem] text-[var(--text-secondary)]",
  featureDot: "size-1.5 shrink-0 rounded-full bg-emerald-400/40",
  divider: "my-7 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]",
  stackNote: "flex items-start gap-3",
  stackLabel: "shrink-0 pt-[0.1rem] font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]",
  stackCopy: "m-0 text-[0.8rem] leading-[1.7] text-[var(--text-muted)]",
};

export function LandingPricingSection({ reduced = false }: LandingPricingSectionProps) {
  return (
    <section id="pricing" className={styles.section} aria-label="Pricing plans" data-landing-pricing-section="true">
      <div className={styles.topGlow} aria-hidden="true" />
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
            <PulseDot className={styles.badgeDot} paused={reduced} />
            <span className={styles.badgeText}>Plans</span>
          </div>
          <h2 className={styles.heading}>Start free,<br />get Pro when ready.</h2>
          <p className={styles.description}>
            Free gives you room to try AlphaCI. Pro raises your project, deployment, environment, and workflow limits when you are shipping for real.
          </p>
          <div className={styles.priceRow}>
            <span className={styles.price} aria-label="PHP 300 per month">PHP 300</span>
            <span className={styles.priceMeta}>/ month for Pro</span>
          </div>
          <div className={styles.trustRow}>
            {trustItems.map((item) => (
              <span className={styles.trustItem} key={item}>
                <span className={styles.trustDot} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
          <div className={styles.actions}>
            <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link className={styles.primaryAction} href="/pricing">View plans &rarr;</Link>
            </motion.div>
            <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link className={styles.secondaryAction} href="/signup?next=%2Fsignup%3Fstep%3Dplan">Start Pro</Link>
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
            <CardAccent reduced={reduced} />
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.cardMeta}>included in pro</p>
                <h3 className={styles.cardTitle}>Everything you need</h3>
              </div>
              <div className={styles.templateBadge}>
                <span className={styles.templateCount}>40+</span>
                <span className={styles.templateLabel}>templates</span>
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
                  <span className={styles.featureName}>{name}</span>
                  <span className={styles.featureDot} aria-hidden="true" />
                </motion.div>
              ))}
            </div>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.stackNote}>
              <span className={styles.stackLabel}>stacks</span>
              <p className={styles.stackCopy}>Next.js, NestJS, React, Node.js, React Native, Expo, Kotlin, Go, Python, Rust, Vue.js, Svelte - and more.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PulseDot({ className, paused }: Readonly<{ className: string; paused: boolean | null }>) {
  return (
    <motion.span
      className={className}
      data-paused={paused ? "true" : undefined}
      aria-hidden="true"
      animate={paused ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.18, 1] }}
      transition={paused ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function CardAccent({ reduced }: Readonly<{ reduced: boolean | null }>) {
  return (
    <motion.div
      className={styles.cardAccent}
      data-paused={reduced ? "true" : undefined}
      aria-hidden="true"
      animate={reduced ? undefined : { backgroundPosition: ["0% 0", "200% 0"] }}
      transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
