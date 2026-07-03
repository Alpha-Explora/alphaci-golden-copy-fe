import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonMode = "public" | "dashboard";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  mode?: ButtonMode;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export interface ButtonLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  children: ReactNode;
  leadingIcon?: ReactNode;
  mode?: ButtonMode;
  size?: ButtonSize;
  trailingIcon?: ReactNode;
  variant?: ButtonVariant;
}

function buttonClassNames({
  className,
  loading = false,
  mode = "dashboard",
  size = "md",
  variant = "primary",
}: {
  className?: string;
  loading?: boolean;
  mode?: ButtonMode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    styles[mode],
    loading ? styles.loading : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  children,
  className,
  disabled,
  leadingIcon,
  loading = false,
  mode = "dashboard",
  size = "md",
  trailingIcon,
  type = "button",
  variant = "primary",
  ...props
}: Readonly<ButtonProps>) {
  const classNames = buttonClassNames({ className, loading, mode, size, variant });

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      type={type}
      aria-busy={loading ? "true" : undefined}
      {...props}
    >
      {leadingIcon ? <span className={styles.iconSlot}>{leadingIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {trailingIcon ? <span className={styles.iconSlot}>{trailingIcon}</span> : null}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  leadingIcon,
  mode = "dashboard",
  size = "md",
  trailingIcon,
  variant = "primary",
  ...props
}: Readonly<ButtonLinkProps>) {
  const classNames = buttonClassNames({ className, mode, size, variant });

  return (
    <Link className={classNames} {...props}>
      {leadingIcon ? <span className={styles.iconSlot}>{leadingIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {trailingIcon ? <span className={styles.iconSlot}>{trailingIcon}</span> : null}
    </Link>
  );
}
