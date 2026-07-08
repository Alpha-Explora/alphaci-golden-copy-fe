import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  const baseClasses =
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent [font-family:var(--font-dash-body),var(--font-body),sans-serif] font-bold leading-none no-underline transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-[0.58] disabled:transform-none not-disabled:hover:-translate-y-0.5 not-disabled:active:scale-[0.98]";

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-9 px-[0.9rem] text-[0.78rem]",
    md: "min-h-[2.625rem] px-[1.1rem] text-sm",
    lg: "min-h-12 px-[1.35rem] text-[0.95rem]",
  };

  const modeClasses: Record<ButtonMode, string> = {
    dashboard: "tracking-normal",
    public: "[font-family:var(--font-display),var(--font-dash-display),sans-serif] uppercase tracking-[0.08em]",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    danger:
      "border-red-300/40 bg-red-500/15 text-red-200 not-disabled:hover:border-red-300/60 not-disabled:hover:bg-red-500/20",
    ghost:
      "border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] not-disabled:hover:border-[var(--brand)] not-disabled:hover:bg-[var(--brand-light)] not-disabled:hover:text-[var(--text-primary)] not-disabled:hover:shadow-[0_8px_16px_rgba(0,0,0,0.3),0_0_12px_rgba(121,192,255,0.1)]",
    primary:
      "border-cyan-400/70 bg-[var(--brand)] text-white shadow-[0_1px_2px_rgba(79,142,255,0.3)] not-disabled:hover:bg-[var(--brand-strong)] not-disabled:hover:shadow-[0_0_24px_rgba(121,192,255,0.5),0_8px_16px_rgba(0,0,0,0.4)]",
    secondary:
      "border-slate-400/30 bg-slate-900/70 text-[var(--text-primary)] not-disabled:hover:border-cyan-400/40 not-disabled:hover:bg-cyan-400/10",
  };

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    modeClasses[mode],
    loading && "cursor-wait",
    className,
  );
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
      {leadingIcon ? <span className="inline-flex flex-none items-center">{leadingIcon}</span> : null}
      <span className="min-w-0">{children}</span>
      {trailingIcon ? <span className="inline-flex flex-none items-center">{trailingIcon}</span> : null}
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
      {leadingIcon ? <span className="inline-flex flex-none items-center">{leadingIcon}</span> : null}
      <span className="min-w-0">{children}</span>
      {trailingIcon ? <span className="inline-flex flex-none items-center">{trailingIcon}</span> : null}
    </Link>
  );
}
