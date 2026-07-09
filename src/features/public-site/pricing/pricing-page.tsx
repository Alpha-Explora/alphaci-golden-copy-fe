import { Button, ButtonLink } from "@/components/ui/button/button";
import { PricingPageShell } from "@/features/public-site/pricing/pricing-page-shell";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Try AlphaCI and generate your first governed CI/CD workflows.",
    price: "PHP 0",
    period: "/ month",
    creditLine: "Starter credits included",
    status: "Included",
    action: { label: "Sign up", href: "/signup?next=%2Fsignup%3Fstep%3Dplan" },
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
    action: { label: "Start Pro", href: "/signup?next=%2Fsignup%3Fstep%3Dplan" },
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
    answer: "Yes. Pro is the self-serve paid plan in this version and starts from the signup plan step.",
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

const styles = {
  container: "mx-auto w-[min(1180px,calc(100%-2rem))] max-[480px]:w-[min(100%-1rem,1180px)]",
  hero: "grid grid-cols-[minmax(0,1.05fr)_minmax(280px,0.5fr)] items-end gap-8 pt-20 pb-8 max-[760px]:grid-cols-1 max-[760px]:pt-12",
  heroCopy: "max-w-[760px]",
  kicker: "mb-4 inline-flex items-center gap-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--brand)]",
  kickerDot: "size-[0.4rem] rounded-full bg-[var(--brand-accent)] shadow-[0_0_16px_rgba(52,211,153,0.65)]",
  heroTitle:
    "m-0 max-w-[13ch] font-[var(--font-display),var(--font-dash-display),system-ui,sans-serif] text-[clamp(3.1rem,4.4rem,4.4rem)] font-extrabold leading-[0.96] tracking-normal text-[var(--text-primary)] max-[760px]:max-w-[10ch] max-[760px]:text-[3.2rem] max-[480px]:text-[2.65rem]",
  heroText: "mt-5 max-w-[64ch] text-base leading-[1.75] text-[#b6c2d3]",
  heroPanel:
    "grid gap-4 rounded-lg border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.84),rgba(2,6,23,0.74)),linear-gradient(135deg,rgba(56,189,248,0.08),rgba(52,211,153,0.04))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)]",
  panelLabel: "mb-2 block font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-accent)]",
  panelTitle: "block text-[1.15rem] leading-[1.35] text-[var(--text-primary)]",
  panelText: "m-0 text-[0.9rem] leading-[1.65] text-[var(--text-secondary)]",
  plans: "grid grid-cols-4 gap-4 py-8 pb-16 max-[1080px]:grid-cols-2 max-[760px]:grid-cols-1",
  planCard:
    "flex min-h-full flex-col gap-[1.15rem] rounded-lg border border-slate-400/15 bg-[#060d1d]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-[760px]:p-4",
  featuredPlan:
    "border-cyan-400/40 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.18),transparent_16rem),linear-gradient(180deg,rgba(8,22,43,0.95),rgba(6,13,29,0.88))] shadow-[0_22px_70px_rgba(14,165,233,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]",
  cardTop: "grid gap-[0.85rem]",
  planName: "mb-[0.65rem] mt-0 font-[var(--font-dash-display),system-ui,sans-serif] text-[1.18rem] font-extrabold tracking-normal text-[var(--text-primary)]",
  planDescription: "m-0 text-[0.9rem] leading-[1.55] text-[var(--text-secondary)]",
  status: "w-fit rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-[0.62rem] py-[0.28rem] font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-[var(--brand)]",
  price: "flex min-h-14 items-baseline gap-[0.35rem] pt-1",
  priceValue: "font-[var(--font-dash-display),system-ui,sans-serif] text-4xl font-extrabold leading-none tracking-normal text-[var(--text-primary)] max-[480px]:text-[1.55rem]",
  pricePeriod: "text-[0.82rem] not-italic text-[var(--text-muted)]",
  credits: "grid min-h-[4.1rem] gap-[0.35rem] rounded-lg border border-white/[0.07] bg-white/[0.03] p-[0.9rem]",
  creditLine: "text-[0.92rem] leading-[1.35] text-[var(--text-primary)]",
  creditNote: "text-[0.75rem] leading-[1.45] text-[var(--text-muted)]",
  action: "w-full rounded-full font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.08em]",
  disabledAction: "w-full cursor-not-allowed rounded-full border-slate-400/10 bg-slate-400/[0.06] font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.08em] text-slate-400/60 hover:translate-y-0 hover:border-slate-400/10 hover:bg-slate-400/[0.06]",
  featureList: "m-0 grid list-none gap-[0.72rem] p-0 pt-1",
  featureItem: "grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-[0.55rem] text-[0.86rem] leading-[1.45] text-slate-300",
  featureIcon: "mt-[0.1rem] size-4 text-[var(--brand-accent)]",
  detailSection: "mx-auto w-[min(1180px,calc(100%-2rem))] max-[480px]:w-[min(100%-1rem,1180px)]",
  explainer:
    "mb-16 grid grid-cols-[minmax(240px,0.55fr)_minmax(0,1fr)] items-start gap-8 rounded-lg border border-emerald-400/20 bg-[radial-gradient(circle_at_96%_0%,rgba(52,211,153,0.12),transparent_20rem),rgba(6,13,29,0.72)] p-6 max-[760px]:grid-cols-1",
  sectionTitle: "m-0 font-[var(--font-display),var(--font-dash-display),system-ui,sans-serif] text-3xl font-extrabold leading-[1.1] tracking-normal text-[var(--text-primary)]",
  explainerText: "m-0 text-base leading-[1.75] text-[#b6c2d3]",
  compareFaq: "pb-16",
  sectionHeading: "mb-5",
  tableWrap: "overflow-x-auto rounded-lg border border-slate-400/15 bg-[#060d1d]/70",
  table: "w-full min-w-[820px] border-collapse",
  faqList: "grid grid-cols-2 gap-4 max-[760px]:grid-cols-1",
  faqItem: "rounded-lg border border-slate-400/15 bg-[#060d1d]/70 p-[1.15rem]",
  faqQuestion: "mb-[0.55rem] mt-0 font-[var(--font-dash-display),system-ui,sans-serif] text-base font-extrabold tracking-normal text-[var(--text-primary)]",
  faqAnswer: "m-0 text-[0.9rem] leading-[1.65] text-[var(--text-secondary)]",
};

function Kicker({ children }: Readonly<{ children: string }>) {
  return (
    <span className={styles.kicker}>
      <span className={styles.kickerDot} aria-hidden="true" />
      {children}
    </span>
  );
}

function CheckIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
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

export function PricingPage() {
  return (
    <PricingPageShell>
      <section id="main-content" className={cn(styles.container, styles.hero)} aria-labelledby="pricing-page-title">
        <div className={styles.heroCopy}>
          <Kicker>Usage-based pricing</Kicker>
          <h1 id="pricing-page-title" className={styles.heroTitle}>Credits for governed CI/CD automation.</h1>
          <p className={styles.heroText}>
            AlphaCI subscriptions include monthly credits that power workflow generation,
            update PRs, and release visibility. Start free, then upgrade when your workspace
            needs predictable automation capacity.
          </p>
        </div>
        <div className={styles.heroPanel} aria-label="Credit model summary">
          <div>
            <span className={styles.panelLabel}>Monthly reset</span>
            <strong className={styles.panelTitle}>Subscription credits refresh every cycle.</strong>
          </div>
          <p className={styles.panelText}>
            Top-up sachets and detailed action pricing are planned later, after the credit
            model is finalized.
          </p>
        </div>
      </section>

      <section className={cn(styles.container, styles.plans)} aria-label="AlphaCI plans">
        {plans.map((plan) => {
          const featured = "featured" in plan && plan.featured;

          return (
            <article className={cn(styles.planCard, featured && styles.featuredPlan)} key={plan.name}>
              <div className={styles.cardTop}>
                <div>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>
                <span className={styles.status}>{plan.status}</span>
              </div>

              <div className={styles.price}>
                <span className={styles.priceValue}>{plan.price}</span>
                {plan.period && <em className={styles.pricePeriod}>{plan.period}</em>}
              </div>

              <div className={styles.credits}>
                <strong className={styles.creditLine}>{plan.creditLine}</strong>
                {"creditNote" in plan && plan.creditNote ? <small className={styles.creditNote}>{plan.creditNote}</small> : null}
              </div>

              {"href" in plan.action ? (
                <ButtonLink
                  className={styles.action}
                  href={plan.action.href}
                  mode="public"
                  size="md"
                  variant={featured ? "primary" : "secondary"}
                >
                  {plan.action.label}
                </ButtonLink>
              ) : (
                <Button className={styles.disabledAction} disabled mode="public" size="md" type="button" variant="secondary">
                  {plan.action.label}
                </Button>
              )}

              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li className={styles.featureItem} key={feature}>
                    <CheckIcon className={styles.featureIcon} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className={cn(styles.detailSection, styles.explainer)} aria-labelledby="credit-model-title">
        <div>
          <Kicker>Credit model</Kicker>
          <h2 className={styles.sectionTitle} id="credit-model-title">Simple publicly, tunable internally.</h2>
        </div>
        <p className={styles.explainerText}>
          Credits keep pricing tied to automation outcomes without exposing raw compute math.
          Public plans explain typical capacity now, while the internal ledger can later
          weight heavier actions differently to protect margins and keep small workspaces
          affordable.
        </p>
      </section>

      <section className={cn(styles.detailSection, styles.compareFaq)} aria-labelledby="compare-plans-title">
        <div className={styles.sectionHeading}>
          <Kicker>Compare</Kicker>
          <h2 className={styles.sectionTitle} id="compare-plans-title">Plan capabilities</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className="border-b border-slate-400/10 bg-white/[0.035] p-4 text-left align-top font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--text-primary)]" scope="col">Capability</th>
                <th className="border-b border-slate-400/10 bg-white/[0.035] p-4 text-left align-top font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--text-primary)]" scope="col">Free</th>
                <th className="border-b border-slate-400/10 bg-white/[0.035] p-4 text-left align-top font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--text-primary)]" scope="col">Pro</th>
                <th className="border-b border-slate-400/10 bg-white/[0.035] p-4 text-left align-top font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--text-primary)]" scope="col">Team</th>
                <th className="border-b border-slate-400/10 bg-white/[0.035] p-4 text-left align-top font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--text-primary)]" scope="col">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([capability, free, pro, team, enterprise]) => (
                <tr key={capability}>
                  <th className="border-b border-slate-400/10 p-4 text-left align-top text-sm font-bold leading-[1.45] text-[var(--text-primary)] last:border-b-0" scope="row">{capability}</th>
                  <td className="border-b border-slate-400/10 p-4 text-left align-top text-sm leading-[1.45] text-slate-300 last:border-b-0">{free}</td>
                  <td className="border-b border-slate-400/10 p-4 text-left align-top text-sm leading-[1.45] text-slate-300 last:border-b-0">{pro}</td>
                  <td className="border-b border-slate-400/10 p-4 text-left align-top text-sm leading-[1.45] text-slate-300 last:border-b-0">{team}</td>
                  <td className="border-b border-slate-400/10 p-4 text-left align-top text-sm leading-[1.45] text-slate-300 last:border-b-0">{enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cn(styles.detailSection, styles.compareFaq)} aria-labelledby="pricing-faq-title">
        <div className={styles.sectionHeading}>
          <Kicker>FAQ</Kicker>
          <h2 className={styles.sectionTitle} id="pricing-faq-title">Pricing details</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <article key={item.question} className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>{item.question}</h3>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PricingPageShell>
  );
}
