import type { ReactNode } from "react";

import { PublicSiteNav } from "@/components/layout/public-site-nav";
import { SkipLink } from "@/components/layout/public-shell";

import styles from "./pricing-page-shell.module.css";

type PricingPageShellProps = Readonly<{ children: ReactNode }>;

export function PricingPageShell({ children }: PricingPageShellProps) {
  return (
    <main className={styles.shell} data-pricing-page-shell="true">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <PublicSiteNav active="pricing" />
      {children}
    </main>
  );
}