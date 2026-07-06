"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { createGitHubLoginUrl, warmupBackend } from "@/lib/api/client";
import { getAuthenticatedRedirectPath } from "@/lib/auth/subscription";

import cardStyles from "./oauth-auth-card.module.css";
import styles from "./oauth-auth-page.module.css";

interface OAuthAuthPageProps {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  switchText: string;
  switchHref: string;
  switchCta: string;
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.77.5 12.27c0 5.2 3.3 9.6 7.88 11.15.58.11.79-.26.79-.57 0-.28-.01-1.2-.02-2.18-3.2.71-3.88-1.39-3.88-1.39-.53-1.37-1.29-1.73-1.29-1.73-1.05-.74.08-.73.08-.73 1.17.08 1.78 1.22 1.78 1.22 1.03 1.81 2.71 1.29 3.37.98.1-.77.4-1.29.72-1.58-2.56-.3-5.26-1.3-5.26-5.8 0-1.28.45-2.33 1.18-3.16-.12-.3-.51-1.53.11-3.19 0 0 .97-.32 3.18 1.2a10.8 10.8 0 0 1 5.8 0c2.2-1.52 3.17-1.2 3.17-1.2.63 1.66.24 2.9.12 3.19.73.83 1.17 1.88 1.17 3.16 0 4.51-2.71 5.49-5.3 5.78.41.37.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.21 0 .31.21.69.8.57a11.83 11.83 0 0 0 7.87-11.15C23.5 5.77 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.77-.07-1.5-.2-2.2H12v4.16h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.49Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2 10 10 0 0 0 3.07 7.51l3.34 2.59C7.21 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}

function EyeGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function toSafeNextPath(raw: string | null): string {
  if (!raw) return "/home";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/home";
}

function _ProductPreviewPanel() {
  const cards = [
    { title: "Build", meta: "Node 20", value: "Passed" },
    { title: "Tests", meta: "Jest", value: "148 specs" },
    { title: "Deploy", meta: "Cloud Run", value: "Ready" },
    { title: "Secrets", meta: "GCP", value: "Synced" },
  ];

  return (
    <aside className={styles.previewPanel} aria-hidden="true">
      <div className={styles.previewFrame}>
        <div className={styles.previewTopbar}>
          <span className={styles.previewMark}>A</span>
          <span>AlphaCI</span>
          <span className={styles.previewSeparator}>/</span>
          <strong>payments-api</strong>
          <span className={styles.previewEnv}>production</span>
        </div>
        <div className={styles.previewTabs}>
          <span className={styles.previewTabActive}>Environment</span>
          <span>Deployments</span>
          <span>Commands</span>
          <span>Logs</span>
          <span>Settings</span>
        </div>
        <div className={styles.previewHeader}>
          <div>
            <p>payments-api · production</p>
            <span>github.com/alpha/payments-api · US East</span>
          </div>
          <button type="button" tabIndex={-1}>Connect monitor</button>
        </div>
        <div className={styles.previewCanvas}>
          {cards.map((card) => (
            <div className={styles.previewCard} key={card.title}>
              <div>
                <strong>{card.title}</strong>
                <span>{card.meta}</span>
              </div>
              <em>{card.value}</em>
            </div>
          ))}
          <div className={styles.previewCardWide}>
            <strong>Workflow summary</strong>
            <span>Generated YAML, environment checks, provider setup, and guarded release gates are ready for review.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

const pipelineStages = ["Source", "Build", "Test", "Deploy"];

function PipelineStagesVisual() {
  return (
    <div className={styles.pipelineStages}>
      {pipelineStages.map((stage, index) => (
        <div className={styles.pipelineStage} key={stage}>
          <div className={styles.pipelineNode}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </div>
          <span>{stage}</span>
          {index < pipelineStages.length - 1 ? <i aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function LegacyVisualPanel({ mode }: Readonly<{ mode: "login" | "signup" }>) {
  const bullets = [
    "Source-backed YAML generation",
    "40+ framework templates ready",
    "GitHub repo and branch rules setup",
    "Export and push in under 2 minutes",
  ];

  return (
    <aside className={styles.legacyPanel} aria-hidden="true">
      <div className={styles.legacyEffects}>
        <span className={`${styles.rail} ${styles.railA}`} />
        <span className={`${styles.rail} ${styles.railB}`} />
        <span className={`${styles.signal} ${styles.signalA}`} />
        <span className={`${styles.signal} ${styles.signalB}`} />
      </div>

      <div className={styles.legacyContent}>
        <div className={styles.accessShowcase}>
          <span className={styles.accessNode}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" focusable="false">
              <path d="M8 12.5 10.5 15 16 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
              <path d="M12 3 19 6.1v5.3c0 4.4-2.8 8.3-7 9.6-4.2-1.3-7-5.2-7-9.6V6.1L12 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </span>
          <div>
            <span>Secure workspace access</span>
            <strong>{mode === "login" ? "GitHub authorization stays connected to your pipelines." : "Start from a protected, GitHub-backed workflow path."}</strong>
          </div>
        </div>

        <div className={styles.pipelineStageShell}>
          <PipelineStagesVisual />
        </div>

        <div className={styles.featureBullets}>
          {bullets.map((bullet, index) => (
            <div className={styles.featureBullet} key={bullet}>
              <span data-accent={index % 2 === 0 ? "brand" : "accent"} aria-hidden="true" />
              <p>{bullet}</p>
            </div>
          ))}
        </div>

        <div className={styles.codePanel}>
          <div className={styles.codeSheen} />
          <div className={styles.mockupBar}>
            <span className={styles.mockupDotRed} />
            <span className={styles.mockupDotYellow} />
            <span className={styles.mockupDotGreen} />
            <strong>payments-service.yml</strong>
          </div>
          <pre>
            <span>{`# Generated by AlphaCI\n`}</span>
            <b>name</b>: <em>{`payments-service-ci\n`}</em>
            <b>on</b>{`:\n`}
            {`  `}<b>push</b>{`:\n`}
            {`    `}<b>branches</b>: [<em>&quot;main&quot;</em>, <em>&quot;develop&quot;</em>]
            {`\n`}<b>jobs</b>{`:\n`}
            {`  `}<b>build</b>{`:\n`}
            {`    `}<b>runs-on</b>: <em>ubuntu-latest</em>
          </pre>
        </div>
      </div>
    </aside>
  );
}

export function OAuthAuthPage({
  mode,
  title,
  subtitle,
  switchText,
  switchHref,
  switchCta,
}: Readonly<OAuthAuthPageProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWarming, setIsWarming] = useState(false);
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<"identity" | "password">("identity");
  const [signupEmail, setSignupEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { status, session } = useAuthSession();

  const nextPath = useMemo(() => toSafeNextPath(searchParams.get("next")), [searchParams]);
  const githubCallbackReturnTo = useMemo(() => {
    const callbackPath = new URLSearchParams({
      intent: mode,
      next: nextPath,
      provider: "github",
    });
    const relativeCallbackPath = `/auth/callback?${callbackPath.toString()}`;
    return browserOrigin ? `${browserOrigin}${relativeCallbackPath}` : relativeCallbackPath;
  }, [browserOrigin, mode, nextPath]);

  const githubLoginHref = useMemo(() => createGitHubLoginUrl(githubCallbackReturnTo), [githubCallbackReturnTo]);
  const pageTitle = mode === "login" ? "Sign in to AlphaCI" : "Sign up for AlphaCI";
  const normalSubmitLabel = mode === "login" ? "Sign in" : signupStep === "identity" ? "Continue" : "Create account";

  useEffect(() => {
    setBrowserOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (status !== "signed-in") return;
    const redirectPath = getAuthenticatedRedirectPath(session, nextPath);
    if (redirectPath) router.replace(redirectPath);
  }, [nextPath, router, session, status]);

  async function startGitHubLogin() {
    setIsWarming(true);
    try {
      await warmupBackend();
    } catch {
      // Warmup failure must not block login.
    } finally {
      setIsWarming(false);
    }
    window.location.href = githubLoginHref;
  }

  function handleGoogleStart() {
    setAuthMessage("Google sign-in is ready in the UI, but the backend Google OAuth start route is not enabled yet.");
  }

  function handleNormalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (mode === "signup" && signupStep === "identity") {
      setSignupEmail(email);
      setSignupStep("password");
      setAuthMessage(null);
      return;
    }

    setAuthMessage("Email and password access is not enabled on the backend yet. Use GitHub to continue for now.");
  }

  return (
    <main className={styles.authShell} data-auth-page={mode}>
      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={cardStyles.authCard}>
          <Link className={cardStyles.logoLink} href="/" aria-label="AlphaCI home">
            <Logo size={34} priority />
          </Link>

          <div className={cardStyles.header}>
            <h1 id="auth-title">{pageTitle}</h1>
          </div>

          <form className={cardStyles.form} onSubmit={handleNormalSubmit}>
            {mode === "signup" && signupStep === "identity" ? (
              <div className={cardStyles.nameGrid}>
                <label className={cardStyles.field}>
                  <span>First name</span>
                  <input name="firstName" autoComplete="given-name" placeholder="Your first name" required suppressHydrationWarning />
                </label>
                <label className={cardStyles.field}>
                  <span>Last name</span>
                  <input name="lastName" autoComplete="family-name" placeholder="Your last name" required suppressHydrationWarning />
                </label>
              </div>
            ) : null}

            <label className={cardStyles.field}>
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                defaultValue={mode === "signup" ? signupEmail : ""}
                readOnly={mode === "signup" && signupStep === "password"}
                required
                suppressHydrationWarning
              />
            </label>

            {mode === "login" || signupStep === "password" ? (
              <label className={cardStyles.field}>
                <span>Password</span>
                <span className={cardStyles.passwordControl}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                    minLength={8}
                    required
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <EyeGlyph />
                  </button>
                </span>
              </label>
            ) : null}

            <Button className={cardStyles.submitButton} size="lg" type="submit">
              {normalSubmitLabel}
            </Button>
          </form>

          {mode === "signup" && signupStep === "password" ? (
            <button className={cardStyles.backButton} type="button" onClick={() => setSignupStep("identity")}>
              Go back
            </button>
          ) : null}

          <div className={cardStyles.divider}>
            <span>or</span>
          </div>

          <div className={cardStyles.providerGroup}>
            <button className={cardStyles.providerButton} disabled={isWarming} type="button" onClick={startGitHubLogin}>
              <GitHubGlyph />
              <span>{isWarming ? "Connecting..." : "Continue with GitHub"}</span>
            </button>
            <button className={cardStyles.providerButton} type="button" onClick={handleGoogleStart}>
              <GoogleGlyph />
              <span>Continue with Google</span>
            </button>
          </div>

          {authMessage ? <p className={cardStyles.notice} role="status">{authMessage}</p> : null}
          {status === "loading" ? <p className={cardStyles.notice}>Checking current session...</p> : null}

          <p className={cardStyles.switchText}>
            {switchText} <Link href={switchHref}>{switchCta}</Link>
          </p>
        </div>

        <p className={cardStyles.terms}>
          By creating an account, you agree to the <Link href="/pricing">Terms and Conditions</Link>
        </p>

        <span className={styles.assistiveCopy}>{title} {subtitle}</span>
      </section>

      <LegacyVisualPanel mode={mode} />
    </main>
  );
}
