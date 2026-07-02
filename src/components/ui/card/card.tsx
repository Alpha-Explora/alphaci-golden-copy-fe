import type { HTMLAttributes, ReactNode } from "react";

import styles from "./card.module.css";

type CardVariant = "public" | "dashboard" | "plain";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: CardVariant;
}

export function Card({ children, className, variant = "dashboard", ...props }: Readonly<CardProps>) {
  const classNames = [styles.card, styles[variant], className ?? ""].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      {children}
    </section>
  );
}
