import type { HTMLAttributes, ReactNode } from "react";

import styles from "./badge.module.css";

type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger" | "accent";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  dot?: boolean;
  size?: BadgeSize;
  tone?: BadgeTone;
}

export function Badge({
  children,
  className,
  dot = false,
  size = "sm",
  tone = "neutral",
  ...props
}: Readonly<BadgeProps>) {
  const classNames = [styles.badge, styles[tone], styles[size], className ?? ""].filter(Boolean).join(" ");

  return (
    <span className={classNames} {...props}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
