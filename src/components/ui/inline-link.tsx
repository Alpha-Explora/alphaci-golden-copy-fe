import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InlineLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  children: ReactNode;
}

const inlineLinkClasses = "text-[var(--brand)] underline decoration-[rgba(56,189,248,0.4)] underline-offset-2 transition-colors duration-150 hover:text-[var(--text-primary)] hover:decoration-[var(--brand)] focus-visible:rounded-[0.2rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

export function InlineLink({ children, className, ...props }: Readonly<InlineLinkProps>) {
  return (
    <Link {...props} className={cn(inlineLinkClasses, className)}>
      {children}
    </Link>
  );
}