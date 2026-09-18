"use client";

import type { ReactNode } from "react";

import { DitherBackground } from "@/shared/layout/dither-background";
import { FlowBackground } from "@/shared/layout/flow-background";
import { PublicSiteNav } from "@/shared/layout/public-site-nav";

export function EduAuthShell({
  eyebrow,
  title,
  copy,
  children,
  footer,
}: Readonly<{
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  return (
    <main className="auth-shell-split auth-self-serve relative">
      <FlowBackground variant="calm" />
      <DitherBackground />
      <PublicSiteNav active="pricing" fixed showActions={false} />

      <aside className="auth-left-panel">
        <div className="auth-internal-welcome">
          <p className="auth-internal-kicker">AlphaCI EDU</p>
          <div className="auth-internal-copy">
            <h2>{title}</h2>
            <p>{copy}</p>
          </div>
          <p className="auth-minimal-note">
            A school workspace for focused practice, governed delivery, and the
            people who help students ship.
          </p>
        </div>
      </aside>

      <section className="auth-right-panel">
        <div className="auth-card-shell auth-self-serve-card">
          <div className="auth-header">
            <p className="hero-kicker">{eyebrow}</p>
            {children}
          </div>
          {footer}
        </div>
      </section>
    </main>
  );
}
