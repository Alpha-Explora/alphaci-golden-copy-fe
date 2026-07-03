import type { ReactNode } from "react";

import styles from "./subscribe-page.module.css";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 12.5 4 4L19 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

interface PlanCardProps {
  title: string;
  badge?: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  action: ReactNode;
  secondaryAction?: ReactNode;
}

export function PlanCard({
  title,
  badge,
  description,
  price,
  period,
  features,
  featured = false,
  action,
  secondaryAction,
}: PlanCardProps) {
  return (
    <article className={`${styles.card}${featured ? ` ${styles.cardFeatured}` : ""}`}>
      <div className={styles.cardHeading}>
        <h2>{title}</h2>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <p className={styles.description}>{description}</p>

      <div className={styles.price}>
        <span>{price}</span>
        {period && <em>{period}</em>}
      </div>

      <div className={styles.cardActions}>
        {action}
        {secondaryAction}
      </div>

      <div className={styles.cardRule} />

      <ul className={styles.featureList}>
        {features.map((feature) => (
          <li key={feature}>
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
