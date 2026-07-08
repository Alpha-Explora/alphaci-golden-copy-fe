import type { ReactNode } from "react";

import { PublicSiteNav } from "@/components/layout/public-site-nav";
import { SkipLink } from "@/components/layout/public-shell";

type PricingPageShellProps = Readonly<{ children: ReactNode }>;

export function PricingPageShell({ children }: PricingPageShellProps) {
  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.14),transparent_30rem),radial-gradient(circle_at_86%_6%,rgba(52,211,153,0.1),transparent_28rem),linear-gradient(180deg,#020617_0%,#050816_42%,#030712_100%)] font-[var(--font-dash-body),system-ui,sans-serif] text-[var(--text-primary)]"
      data-pricing-page-shell="true"
    >
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <PublicSiteNav active="pricing" />
      {children}
    </main>
  );
}
