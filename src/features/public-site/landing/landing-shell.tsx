import type { ReactNode } from "react";

import { FlowBackground } from "@/components/layout/flow-background";
import { PublicSiteNav } from "@/components/layout/public-site-nav";
import { SkipLink } from "@/components/layout/public-shell";

type LandingShellActive = "features" | "guide" | "pricing";

interface LandingShellProps {
  active?: LandingShellActive;
  children: ReactNode;
}

export function LandingShell({ active = "features", children }: Readonly<LandingShellProps>) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" data-landing-shell="true">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <FlowBackground />
      <PublicSiteNav active={active} fixed />
      <div id="main-content">
        {children}
      </div>
    </main>
  );
}
