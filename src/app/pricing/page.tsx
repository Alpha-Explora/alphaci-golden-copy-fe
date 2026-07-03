import type { Metadata } from "next";
import Link from "next/link";

import { PricingPageShell } from "@/features/public-site/pricing/pricing-page-shell";

import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing | AlphaCI",
  description:
    "Choose an AlphaCI plan. Monthly credits power governed CI/CD automation, workflow updates, and release visibility.",
};

const plans = [
  {
    name: "Free",
    description: "Try AlphaCI and generate your first governed CI/CD workflows.",
    price: "PHP 0",
    period: "/ month",
    creditLine: "Starter credits included",
    status: "Included",
    action: { label: "Sign up", href: "/signup" },
    features: [
      "Starter workflow generation",
      "Basic release visibility",
      "Single workspace",
      "Community support",
    ],
  },
  {
    name: "Pro",
    description: "For active builders shipping small projects with recurring automation needs.",
    price: "PHP 300",
    period: "/ month",
    creditLine: "2,500 credits / month",
    creditNote: "Placeholder allowance while credit pricing is finalized.",
    status: "Self-serve",
    action: { label: "Start Pro", href: "/subscribe" },
    featured: true,
    features: [
      "Monthly automation credits",
      "Workflow generation and update PRs",
      "Release visibility for active projects",
      "Monthly credits reset each cycle",
    ],
  },
  {
    name: "Team",
    description: "For teams that need pooled usage, shared governance, and audit history.",
    price: "Coming soon",
    period: "",
    creditLine: "Pooled credits planned",
    status: "Coming soon",
    action: { label: "Coming soon", disabled: true },
    features: [
      "Pooled workspace credits",
      "Team roles and shared controls",
      "Audit and release history",
      "Higher usage needs",
    ],
  },
  {
    name: "Enterprise",
    description: "For organizations that need advanced controls, support, and custom scale.",
    price: "Coming soon",
    period: "",
    creditLine: "Custom scale planned",
    status: "Coming soon",
    action: { label: "Coming soon", disabled: true },
    features: [
      "Advanced governance",
      "Custom usage planning",
      "Priority support path",
      "Future custom terms",
    ],
  },
] as const;

const comparisonRows = [
  ["Monthly credits", "Starter credits", "2,500 placeholder", "Pooled credits planned", "Custom scale planned"],
  ["Workflow generation", "Starter usage", "Included with credits", "Higher team usage", "Custom usage planning"],
  ["Workflow update PRs", "Limited", "Included with credits", "Team review controls", "Advanced controls"],
  ["Release visibility", "Basic", "Active projects", "Shared team history", "Organization history"],
  ["Audit and history", "Basic activity", "Workspace activity", "Team audit history", "Advanced governance"],
  ["Support", "Community", "Standard", "Planned priority path", "Dedicated path planned"],
] as const;

const faqItems = [
  {
    question: "What are AlphaCI credits?",
    answer:
      "Credits power automation actions such as workflow generation, workflow updates, and release visibility work. Exact per-action pricing will be finalized before detailed credit menus are published.",
  },
  {
    question: "Do subscription credits roll over?",
    answer: "No. Monthly subscription credits reset every month so plan usage stays predictable.",
  },
  {
    question: "Is Pro self-serve?",
    answer: "Yes. Pro is the only self-serve paid plan in this version and continues through the existing billing page.",
  },
  {
    question: "Are Team and Enterprise available now?",
    answer:
      "Not yet. They are shown as coming soon while pooled credits, governance, and support terms are finalized.",
  },
  {
    question: "Can I buy top-up sachets?",
    answer:
      "Not in this first public version. Usage-based add-ons are planned after the credit ledger and checkout rules are finalized.",
  },
] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3.2 8.4 6.4 11.5 12.9 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <PricingPageShell>
      <section id="main-content" className={styles.hero} aria-labelledby="pricing-page-title">
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Usage-based pricing</span>
          <h1 id="pricing-page-title">Credits for governed CI/CD automation.</h1>
          <p>
            AlphaCI subscriptions include monthly credits that power workflow generation,
            update PRs, and release visibility. Start free, then upgrade when your workspace
            needs predictable automation capacity.
          </p>
        </div>
        <div className={styles.heroPanel} aria-label="Credit model summary">
          <div>
            <span className={styles.panelLabel}>Monthly reset</span>
            <strong>Subscription credits refresh every cycle.</strong>
          </div>
          <p>
            Top-up sachets and detailed action pricing are planned later, after the credit
            model is finalized.
          </p>
        </div>
      </section>

      <section className={styles.plans} aria-label="AlphaCI plans">
        {plans.map((plan) => (
          <article
            className={`${styles.card}${"featured" in plan && plan.featured ? ` ${styles.featured}` : ""}`}
            key={plan.name}
          >
            <div className={styles.cardTop}>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>
              <span className={styles.status}>{plan.status}</span>
            </div>

            <div className={styles.price}>
              <span>{plan.price}</span>
              {plan.period && <em>{plan.period}</em>}
            </div>

            <div className={styles.credits}>
              <strong>{plan.creditLine}</strong>
              {"creditNote" in plan && plan.creditNote ? <small>{plan.creditNote}</small> : null}
            </div>

            {"href" in plan.action ? (
              <Link
                className={`${styles.button}${"featured" in plan && plan.featured ? ` ${styles.primaryButton}` : ""}`}
                href={plan.action.href}
              >
                {plan.action.label}
              </Link>
            ) : (
              <button className={`${styles.button} ${styles.disabledButton}`} type="button" disabled>
                {plan.action.label}
              </button>
            )}

            <ul className={styles.featureList}>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className={styles.explainer} aria-labelledby="credit-model-title">
        <div>
          <span className={styles.kicker}>Credit model</span>
          <h2 id="credit-model-title">Simple publicly, tunable internally.</h2>
        </div>
        <p>
          Credits keep pricing tied to automation outcomes without exposing raw compute math.
          Public plans explain typical capacity now, while the internal ledger can later
          weight heavier actions differently to protect margins and keep small workspaces
          affordable.
        </p>
      </section>

      <section className={styles.compare} aria-labelledby="compare-plans-title">
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Compare</span>
          <h2 id="compare-plans-title">Plan capabilities</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">Free</th>
                <th scope="col">Pro</th>
                <th scope="col">Team</th>
                <th scope="col">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([capability, free, pro, team, enterprise]) => (
                <tr key={capability}>
                  <th scope="row">{capability}</th>
                  <td>{free}</td>
                  <td>{pro}</td>
                  <td>{team}</td>
                  <td>{enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="pricing-faq-title">
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>FAQ</span>
          <h2 id="pricing-faq-title">Pricing details</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <article key={item.question} className={styles.faqItem}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PricingPageShell>
  );
}
