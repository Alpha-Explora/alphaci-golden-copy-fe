import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type ButtonMode = "public" | "dashboard";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  mode?: ButtonMode;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
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
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    styles[mode],
    loading ? styles.loading : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

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
