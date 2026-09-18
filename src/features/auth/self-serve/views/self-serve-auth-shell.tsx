"use client";

import type { ReactNode } from "react";

import { DitherBackground } from "@/shared/layout/dither-background";
import { FlowBackground } from "@/shared/layout/flow-background";
import { PublicSiteNav } from "@/shared/layout/public-site-nav";

interface SelfServeAuthShellProps {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
}

export function SelfServeAuthShell({
  eyebrow,
  title,
  copy,
  children,
}: Readonly<SelfServeAuthShellProps>) {
  return (
    <main className="auth-shell-split auth-self-serve relative">
      <FlowBackground variant="calm" />
      <DitherBackground />
      <PublicSiteNav active="pricing" fixed showActions={false} />

      <aside className="auth-left-panel">
        <div className="auth-internal-welcome">
          <p className="auth-internal-kicker">AlphaCI platform</p>
          <div className="auth-internal-copy">
            <h2>{title}</h2>
            <p>{copy}</p>
          </div>
          <p className="auth-minimal-note">
            One workspace for governed pipelines, deployments, and the people
            who ship them.
          </p>
        </div>
      </aside>

      <section className="auth-right-panel">
        <div className="auth-card-shell auth-self-serve-card">
          <div className="auth-header">
            <p className="hero-kicker">{eyebrow}</p>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export function GitHubGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.77.5 12.27c0 5.2 3.3 9.6 7.88 11.15.58.11.79-.26.79-.57 0-.28-.01-1.2-.02-2.18-3.2.71-3.88-1.39-3.88-1.39-.53-1.37-1.29-1.73-1.29-1.73-1.05-.74.08-.73.08-.73 1.17.08 1.78 1.22 1.78 1.22 1.03 1.81 2.71 1.29 3.37.98.1-.77.4-1.29.72-1.58-2.56-.3-5.26-1.3-5.26-5.8 0-1.28.45-2.33 1.18-3.16-.12-.3-.51-1.53.11-3.19 0 0 .97-.32 3.18 1.2a10.8 10.8 0 0 1 5.8 0c2.2-1.52 3.17-1.2 3.17-1.2.63 1.66.24 2.9.12 3.19.73.83 1.17 1.88 1.17 3.16 0 4.51-2.71 5.49-5.3 5.78.41.37.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.21 0 .31.21.69.8.57a11.83 11.83 0 0 0 7.87-11.15C23.5 5.77 18.35.5 12 .5Z"
      />
    </svg>
  );
}

export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.77-.07-1.5-.2-2.2H12v4.16h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.49Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2 10 10 0 0 0 3.07 7.51l3.34 2.59C7.21 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}

export function ProviderButtons({
  loading,
  onProvider,
  signup = false,
}: Readonly<{
  loading: "github" | "google" | null;
  onProvider: (provider: "github" | "google") => void;
  signup?: boolean;
}>) {
  return (
    <div className="auth-provider-grid auth-self-serve-providers">
      <button
        className="auth-provider-button"
        disabled={loading !== null}
        onClick={() => onProvider("github")}
        type="button"
      >
        <span className="auth-provider-icon"><GitHubGlyph /></span>
        <span className="auth-provider-copy">
          <span className="auth-provider-label">
            {loading === "github"
              ? "Connecting to GitHub…"
              : signup
                ? "Continue with GitHub"
                : "Sign in with GitHub"}
          </span>
          <span className="auth-provider-meta">Use your connected workspace identity</span>
        </span>
      </button>
      <button
        className="auth-provider-button"
        disabled={loading !== null}
        onClick={() => onProvider("google")}
        type="button"
      >
        <span className="auth-provider-icon"><GoogleGlyph /></span>
        <span className="auth-provider-copy">
          <span className="auth-provider-label">
            {loading === "google" ? "Connecting to Google…" : "Continue with Google"}
          </span>
          <span className="auth-provider-meta">Fast sign-in with a verified email</span>
        </span>
      </button>
    </div>
  );
}
