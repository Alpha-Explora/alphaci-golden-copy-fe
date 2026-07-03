import Link from "next/link";

import { FlowBackground } from "@/components/layout/flow-background";
import { PublicSiteNav } from "@/components/layout/public-site-nav";

import { compareRows, planLimits } from "./subscribe-data";
import { PlanCard } from "./subscribe-plan-card";
import styles from "./subscribe-page.module.css";

export function PublicSubscribePage({ error }: { error: string | null }) {
  return (
    <main className={styles.publicShell} suppressHydrationWarning>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <FlowBackground />
      <PublicSiteNav active="pricing" />

      <div id="main-content" className={styles.publicContent}>
        <section className={styles.publicHeader}>
          <h1>Plans for CI/CD builders</h1>
          <p>
            Start on Free, then upgrade when your workflow automation needs more projects,
            release targets, environment keys, and monthly credits.
          </p>
        </section>

        {error && (
          <p className={styles.publicStatus} role="status">
            {error}
          </p>
        )}

        <section className={`${styles.grid} ${styles.publicGrid}`} aria-label="Public subscription plans">
          <PlanCard
            title="Free"
            description="For trying AlphaCI with small projects."
            price="PHP 0"
            period="/ month"
            action={
              <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/signup?next=/subscribe">
                Get Free
              </Link>
            }
            features={[
              `${planLimits.free.projects} projects`,
              planLimits.free.releaseLanes,
              planLimits.free.targets,
              planLimits.free.env,
              planLimits.free.prs,
            ]}
          />

          <PlanCard
            title="Pro Monthly"
            badge="Recommended"
            description="For shipping production workflows."
            price="PHP 300"
            period="/ month"
            featured
            action={
              <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/signup?next=/subscribe">
                Get Pro
              </Link>
            }
            features={[
              "Everything in Free, and:",
              `${planLimits.pro.projects} projects`,
              planLimits.pro.releaseLanes,
              planLimits.pro.targets,
              planLimits.pro.env,
              planLimits.pro.prs,
            ]}
          />

          <PlanCard
            title="Team"
            description="For shared governance and higher limits."
            price="Custom"
            action={
              <a className={`${styles.button} ${styles.buttonPrimary}`} href="mailto:sales@alphaci.dev">
                Contact us
              </a>
            }
            features={[
              "Workspace roles",
              "Audit history",
              "Shared deployment providers",
              "Higher usage limits",
              "Priority onboarding",
            ]}
          />
        </section>

        <section id="compare-limits" className={styles.comparison} aria-labelledby="compare-limits-title">
          <h2 id="compare-limits-title">Compare limits</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Free</th>
                  <th scope="col">Pro</th>
                  <th scope="col">Team</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([feature, free, pro, team]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>{free}</td>
                    <td>{pro}</td>
                    <td>{team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
