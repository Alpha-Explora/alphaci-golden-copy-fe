import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  const sizeClasses: Record<BadgeSize, string> = {
    sm: "min-h-6 px-2.5 text-[0.72rem]",
    md: "min-h-[1.8rem] px-[0.7rem] text-[0.8rem]",
  };

  const toneClasses: Record<BadgeTone, string> = {
    accent: "border-violet-300/35 bg-violet-400/15 text-violet-300",
    danger: "border-red-300/40 bg-red-500/15 text-red-200",
    info: "border-cyan-400/30 bg-cyan-400/15 text-cyan-300",
    neutral: "border-slate-400/20 bg-slate-900/60 text-[var(--text-muted)]",
    success: "border-teal-300/30 bg-emerald-500/15 text-emerald-300",
    warning: "border-yellow-300/35 bg-yellow-300/10 text-yellow-200",
  };

  const classNames = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border [font-family:var(--font-dash-body),var(--font-body),sans-serif] font-bold leading-none",
    sizeClasses[size],
    toneClasses[tone],
    className,
  );

  return (
    <span className={classNames} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
