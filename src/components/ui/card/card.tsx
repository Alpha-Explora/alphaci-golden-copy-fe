import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardVariant = "public" | "dashboard" | "plain";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: CardVariant;
}

export function Card({ children, className, variant = "dashboard", ...props }: Readonly<CardProps>) {
  const variantClasses: Record<CardVariant, string> = {
    dashboard: "border border-cyan-400/20 bg-[rgba(7,13,28,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    plain: "border-0 bg-transparent",
    public: "border border-slate-600/50 bg-[rgba(7,13,26,0.72)] shadow-[0_24px_70px_rgba(2,8,23,0.32)]",
  };

  const classNames = cn("relative rounded-lg", variantClasses[variant], className);

  return (
    <section className={classNames} {...props}>
      {children}
    </section>
  );
}
