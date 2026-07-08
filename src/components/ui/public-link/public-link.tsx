import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PublicLinkVariant = "nav" | "primary" | "secondary";

export interface PublicLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  active?: boolean;
  children: ReactNode;
  showChevron?: boolean;
  variant?: PublicLinkVariant;
}

export function PublicLink({
  active = false,
  children,
  className,
  showChevron = false,
  variant = "nav",
  ...props
}: Readonly<PublicLinkProps>) {
  const variantClasses: Record<PublicLinkVariant, string> = {
    nav: "min-h-10 px-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:text-[var(--text-primary)]",
    primary:
      "min-h-[clamp(2.3rem,2.55vw,2.8rem)] min-w-[clamp(6.6rem,7vw,7.8rem)] gap-[0.85rem] rounded-full border border-white/60 bg-slate-50 px-[1.55rem] font-black tracking-[0.13em] text-slate-950 shadow-[0_18px_40px_rgba(248,250,252,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] hover:-translate-y-px hover:text-slate-950 hover:shadow-[0_22px_50px_rgba(248,250,252,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:text-slate-950 focus-visible:shadow-[0_22px_50px_rgba(248,250,252,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]",
    secondary:
      "min-h-[clamp(2.3rem,2.55vw,2.8rem)] min-w-[clamp(6.1rem,6.2vw,7.2rem)] rounded-full border border-slate-400/25 bg-slate-950/35 px-[1.4rem] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.22)] hover:-translate-y-px hover:border-cyan-400/35 hover:bg-cyan-400/5 hover:text-[var(--text-primary)] focus-visible:text-[var(--text-primary)]",
  };
  const ariaCurrent = active ? "page" : props["aria-current"];

  return (
    <Link
      {...props}
      className={cn(
        "inline-flex min-h-[clamp(2.3rem,2.55vw,2.8rem)] items-center justify-center gap-[0.45rem] whitespace-nowrap no-underline [font-family:var(--font-display),var(--font-dash-display),sans-serif] text-[clamp(0.7rem,0.72vw,0.84rem)] font-extrabold uppercase tracking-[0.12em] text-[var(--text-primary)] transition-[background-color,border-color,box-shadow,color,text-shadow,transform] duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cyan-400",
        variantClasses[variant],
        active && "text-[var(--text-primary)] [text-shadow:0_0_18px_rgba(56,189,248,0.16)]",
        className,
      )}
      aria-current={ariaCurrent}
    >
      <span className="inline-flex min-w-0 items-center gap-[0.85rem]">{children}</span>
      {showChevron ? (
        <span className="flex-none text-cyan-300" aria-hidden="true">
          {"> "}
        </span>
      ) : null}
    </Link>
  );
}
