"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  checkEmailSignupAvailability,
  createGitHubLoginUrl,
  createGoogleLoginUrl,
  loginWithEmail,
  resendEmailSignupCode,
  startEmailSignup,
  verifyEmailSignupCode,
  warmupBackend,
} from "@/lib/api/client";
import { ApiError } from "@/lib/api/request";
import { getAuthenticatedRedirectPath } from "@/lib/auth/subscription";

import cardStyles from "./oauth-auth-card.styles";
import styles from "./oauth-auth-page.styles";

interface OAuthAuthPageProps {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  switchText: string;
  switchHref: string;
  switchCta: string;
}

type SignupStep = "identity" | "plan" | "password" | "verify";
type SignupPlanId = "starter" | "growth" | "business";

const signupPlans: Array<{
  id: SignupPlanId;
  name: string;
  description: string;
  price: string;
  note?: string;
  features: string[];
}> = [
  {
    id: "starter",
    name: "Starter",
    description: "Everything needed to start deploying governed workflows.",
    price: "\u20B1300 per month",
    note: "Self-serve checkout",
    features: [
      "GitHub-backed workflow generation",
      "Project setup and release visibility",
      "Environment and provider controls",
      "Billing management from the workspace",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For teams moving more services into production.",
    price: "Custom monthly plan",
    features: [
      "Higher project limits",
      "Team roles and approvals",
      "Expanded deployment capacity",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For managed rollout, controls, and dedicated support.",
    price: "Contact sales",
    features: [
      "Custom governance rules",
      "Dedicated onboarding support",
      "Enterprise account controls",
    ],
  },
];

function SignupPlanSelector({
  selectedPlan,
  onSelectPlan,
}: Readonly<{
  selectedPlan: SignupPlanId;
  onSelectPlan: (plan: SignupPlanId) => void;
}>) {
  return (
    <fieldset className={cardStyles.planFieldset}>
      <legend>Paid plan options</legend>
      <div className={cardStyles.planList}>
        {signupPlans.map((plan) => (
          <label
            className={`${cardStyles.planOption}${
              selectedPlan === plan.id ? ` ${cardStyles.planOptionSelected}` : ""
            }`}
            key={plan.id}
          >
            <input
              checked={selectedPlan === plan.id}
              name="signupPlan"
              onChange={() => onSelectPlan(plan.id)}
              type="radio"
              value={plan.id}
            />
            <span className={cardStyles.planTopline}>
              <span>
                <strong>{plan.name}</strong>
                <em>{plan.description}</em>
              </span>
              <i aria-hidden="true" />
            </span>
            <span className={cardStyles.planPrice}>
              {plan.price}
              {plan.note ? <b>{plan.note}</b> : null}
            </span>
            <span className={cardStyles.planDivider} />
            <span className={cardStyles.planFeatures}>
              {plan.features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
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
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.77-.07-1.5-.2-2.2H12v4.16h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.49Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2 10 10 0 0 0 3.07 7.51l3.34 2.59C7.21 7.74 9.4 5.98 12 5.98Z"
      />
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

function ChevronLeftGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m12.5 4.5-5 5.5 5 5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
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
            <p>payments-api {"\u00B7"} production</p>
            <span>github.com/alpha/payments-api {"\u00B7"} US East</span>
          </div>
          <button type="button" tabIndex={-1}>
            Connect monitor
          </button>
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
            <span>
              Generated YAML, environment checks, provider setup, and guarded
              release gates are ready for review.
            </span>
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <polyline
                points="2,6 5,9 10,3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              focusable="false"
            >
              <path
                d="M8 12.5 10.5 15 16 9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
              />
              <path
                d="M12 3 19 6.1v5.3c0 4.4-2.8 8.3-7 9.6-4.2-1.3-7-5.2-7-9.6V6.1L12 3Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <div>
            <span>Secure workspace access</span>
            <strong>
              {mode === "login"
                ? "GitHub authorization stays connected to your pipelines."
                : "Start from a protected, GitHub-backed workflow path."}
            </strong>
          </div>
        </div>

        <div className={styles.pipelineStageShell}>
          <PipelineStagesVisual />
        </div>

        <div className={styles.featureBullets}>
          {bullets.map((bullet, index) => (
            <div className={styles.featureBullet} key={bullet}>
              <span
                data-accent={index % 2 === 0 ? "brand" : "accent"}
                aria-hidden="true"
              />
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
            <b>on</b>
            {`:\n`}
            {`  `}
            <b>push</b>
            {`:\n`}
            {`    `}
            <b>branches</b>: [<em>&quot;main&quot;</em>,{" "}
            <em>&quot;develop&quot;</em>]{`\n`}
            <b>jobs</b>
            {`:\n`}
            {`  `}
            <b>build</b>
            {`:\n`}
            {`    `}
            <b>runs-on</b>: <em>ubuntu-latest</em>
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
  const [signupStep, setSignupStep] = useState<SignupStep>("identity");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupPlan, setSignupPlan] = useState<SignupPlanId>("starter");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(29);
  const [showPassword, setShowPassword] = useState(false);

  const { status, session } = useAuthSession();

  const requestedSignupStep = mode === "signup" ? searchParams.get("step") : null;
  const isPlanSelectionRoute = requestedSignupStep === "plan";
  const requestedNextPath = useMemo(
    () => toSafeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const postAuthPath = mode === "signup" && requestedNextPath === "/home" ? "/subscribe" : requestedNextPath;
  const githubCallbackReturnTo = useMemo(() => {
    const callbackPath = new URLSearchParams({
      intent: mode,
      next: postAuthPath,
      provider: "github",
    });
    const relativeCallbackPath = `/auth/callback?${callbackPath.toString()}`;
    return browserOrigin
      ? `${browserOrigin}${relativeCallbackPath}`
      : relativeCallbackPath;
  }, [browserOrigin, mode, postAuthPath]);

  const googleCallbackReturnTo = useMemo(() => {
    const callbackPath = new URLSearchParams({
      intent: mode,
      next: postAuthPath,
      provider: "google",
    });
    const relativeCallbackPath = `/auth/callback?${callbackPath.toString()}`;
    return browserOrigin
      ? `${browserOrigin}${relativeCallbackPath}`
      : relativeCallbackPath;
  }, [browserOrigin, mode, postAuthPath]);

  const githubLoginHref = useMemo(
    () => createGitHubLoginUrl(githubCallbackReturnTo),
    [githubCallbackReturnTo],
  );
  const googleLoginHref = useMemo(
    () => createGoogleLoginUrl(googleCallbackReturnTo),
    [googleCallbackReturnTo],
  );
  const pageTitle =
    mode === "login"
      ? "Sign in to AlphaCI"
      : signupStep === "verify"
        ? "Verify your email"
        : signupStep === "plan"
          ? "Select a plan"
          : signupStep === "password"
            ? "Secure your account"
            : "Sign up for AlphaCI";
  const normalSubmitLabel =
    mode === "login"
      ? "Sign in"
      : signupStep === "identity"
        ? "Continue"
        : signupStep === "plan"
          ? "Continue to payment"
          : "Create account";
  const isVerifyStep = mode === "signup" && signupStep === "verify";

  useEffect(() => {
    setBrowserOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!isPlanSelectionRoute) return;
    setSignupStep("plan");
  }, [isPlanSelectionRoute]);

  useEffect(() => {
    if (isPlanSelectionRoute) return;
    if (status !== "signed-in") return;
    const redirectPath = getAuthenticatedRedirectPath(session, postAuthPath);
    if (redirectPath) router.replace(redirectPath);
  }, [isPlanSelectionRoute, postAuthPath, router, session, status]);

  useEffect(() => {
    if (signupStep !== "verify" || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown, signupStep]);

  async function startProviderLogin(href: string) {
    setIsWarming(true);
    try {
      await warmupBackend();
    } catch {
      // Warmup failure must not block login.
    } finally {
      setIsWarming(false);
    }
    window.location.href = href;
  }

  function startGitHubLogin() {
    void startProviderLogin(githubLoginHref);
  }

  function handleGoogleStart() {
    void startProviderLogin(googleLoginHref);
  }

  async function handleNormalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (mode === "signup" && signupStep === "identity") {
      setIsSubmitting(true);
      setAuthMessage(null);
      try {
        await checkEmailSignupAvailability(email);
        setSignupFirstName(String(formData.get("firstName") ?? "").trim());
        setSignupLastName(String(formData.get("lastName") ?? "").trim());
        setSignupEmail(email);
        setSignupStep("password");
      } catch (error) {
        setAuthMessage(
          error instanceof ApiError && error.status === 409
            ? "An account already exists. Sign in instead."
            : "We could not check that email. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "signup" && signupStep === "plan") {
      const params = new URLSearchParams({ plan: signupPlan });
      router.push(`/subscribe?${params.toString()}`);
      return;
    }

    setIsSubmitting(true);
    setAuthMessage(null);
    try {
      if (mode === "signup" && signupStep === "password") {
        await startEmailSignup({
          firstName: signupFirstName,
          lastName: signupLastName,
          email: signupEmail || email,
          password: String(formData.get("password") ?? ""),
        });
        setSignupStep("verify");
        setVerificationCode("");
        setResendCooldown(29);
        return;
      }

      await loginWithEmail({
        email,
        password: String(formData.get("password") ?? ""),
      });
      router.replace(postAuthPath);
    } catch (error) {
      setAuthMessage(
        mode === "login"
          ? "We could not sign you in with that email and password."
          : error instanceof ApiError && error.status === 409
            ? "An account already exists. Sign in instead."
            : "We could not start email verification. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCodeComplete(code: string) {
    setIsSubmitting(true);
    setAuthMessage(null);
    try {
      await verifyEmailSignupCode({ email: signupEmail, code });
      setVerificationCode("");
      setResendCooldown(0);
      setSignupStep("plan");
    } catch {
      setAuthMessage("That verification code is invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    setIsSubmitting(true);
    setAuthMessage(null);
    try {
      await resendEmailSignupCode(signupEmail);
      setResendCooldown(29);
    } catch {
      setAuthMessage(
        "We could not send a new verification code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={styles.authShell}
      data-auth-page={mode}
      data-auth-step={isVerifyStep ? "verify" : mode === "signup" && signupStep === "plan" ? "plan" : undefined}
    >
      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={cardStyles.authCard}>
          <Link
            className={cardStyles.logoLink}
            href="/"
            aria-label="AlphaCI home"
          >
            <Logo size={34} priority />
            <span className={cardStyles.brandWordmark}><strong>Alpha</strong><em>CI</em></span>
          </Link>

          <div className={cardStyles.header}>
            <h1 id="auth-title">{pageTitle}</h1>
            {mode === "signup" && signupStep === "plan" ? (
              <p>
                Select a paid plan and add a payment method to finish setting
                up your AlphaCI workspace.
              </p>
            ) : null}
          </div>

          {isVerifyStep ? (
            <div className="flex flex-col gap-5 pt-2 font-[var(--font-dash-body)]">
              <div className="bg-slate-950/20 px-5 py-5 shadow-none">
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="m-0 text-[0.95rem] leading-6 text-slate-200">
                    Enter the code sent to{" "}
                    <strong className="font-semibold text-slate-50">
                      {signupEmail || "your email address"}
                    </strong>
                  </p>

                  <InputOTP
                    autoFocus
                    id="verification-code"
                    label="Email verification code"
                    onChange={setVerificationCode}
                    disabled={isSubmitting}
                    onComplete={handleCodeComplete}
                    value={verificationCode}
                  />

                  <div className="flex flex-col gap-1 text-sm leading-5">
                    <span className="text-slate-100">
                      Didn&apos;t receive a code?
                    </span>
                    <button
                      className="rounded-sm border-0 bg-transparent p-0 text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={handleResendCode}
                      type="button"
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}`
                        : "Resend code"}
                    </button>
                  </div>
                </div>
              </div>

              <Link
                className="inline-flex items-center gap-1 self-center rounded-sm text-sm text-slate-400 no-underline transition hover:text-slate-100 hover:underline hover:underline-offset-4"
                href="/login"
              >
                <ChevronLeftGlyph />
                Back to sign-in
              </Link>
            </div>
          ) : (
            <>
              <form className={`${cardStyles.form}${mode === "signup" && signupStep === "plan" ? ` ${cardStyles.planForm}` : ""}`} onSubmit={handleNormalSubmit}>
                {mode === "signup" && signupStep === "plan" ? (
                  <SignupPlanSelector
                    onSelectPlan={setSignupPlan}
                    selectedPlan={signupPlan}
                  />
                ) : (
                  <>
                    {mode === "signup" && signupStep === "identity" ? (
                      <div className={cardStyles.nameGrid}>
                        <label className={cardStyles.field}>
                          <span>First name</span>
                          <input
                            name="firstName"
                            autoComplete="given-name"
                            placeholder="Your first name"
                            required
                            suppressHydrationWarning
                          />
                        </label>
                        <label className={cardStyles.field}>
                          <span>Last name</span>
                          <input
                            name="lastName"
                            autoComplete="family-name"
                            placeholder="Your last name"
                            required
                            suppressHydrationWarning
                          />
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
                            autoComplete={
                              mode === "login" ? "current-password" : "new-password"
                            }
                            placeholder={
                              mode === "login"
                                ? "Enter your password"
                                : "Create a password"
                            }
                            minLength={8}
                            required
                            suppressHydrationWarning
                          />
                          <button
                            type="button"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowPassword((current) => !current)}
                          >
                            <EyeGlyph />
                          </button>
                        </span>
                      </label>
                    ) : null}
                  </>
                )}

                {mode === "signup" && signupStep === "plan" ? (
                  <p className={cardStyles.termsInline}>
                    By creating an account, you agree to the <Link href="/pricing">Terms and Conditions</Link>
                  </p>
                ) : null}

                <Button
                  className={`${cardStyles.submitButton}${mode === "signup" && signupStep === "plan" ? ` ${cardStyles.planSubmitButton}` : ""}`}
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? "Please wait..." : normalSubmitLabel}
                </Button>
              </form>
              {mode === "signup" && signupStep === "password" ? (
                <button
                  className={cardStyles.backButton}
                  type="button"
                  onClick={() => setSignupStep("identity")}
                >
                  <ChevronLeftGlyph />
                  Go back
                </button>
              ) : null}

              {(mode === "login" || signupStep === "identity") ? (
                <>
              <div className={cardStyles.divider}>
                <span>or</span>
              </div>

              <div className={cardStyles.providerGroup}>
                <button
                  className={cardStyles.providerButton}
                  disabled={isWarming}
                  type="button"
                  onClick={startGitHubLogin}
                >
                  <GitHubGlyph />
                  <span>
                    {isWarming ? "Connecting..." : "Continue with GitHub"}
                  </span>
                </button>
                <button
                  className={cardStyles.providerButton}
                  disabled={isWarming}
                  type="button"
                  onClick={handleGoogleStart}
                >
                  <GoogleGlyph />
                  <span>Continue with Google</span>
                </button>
              </div>

                </>
              ) : null}

              {authMessage ? (
                <p
                  className={`${cardStyles.notice} ${cardStyles.noticeError}`}
                  role="status"
                >
                  {authMessage}
                </p>
              ) : null}
              {status === "loading" ? (
                <p className={cardStyles.notice}>Checking current session...</p>
              ) : null}

              {mode !== "signup" || signupStep !== "plan" ? (
                <p className={cardStyles.switchText}>
                  {switchText} <Link href={switchHref}>{switchCta}</Link>
                </p>
              ) : null}
            </>
          )}
        </div>

        {mode === "signup" && !isVerifyStep && signupStep !== "plan" ? (
          <p className={cardStyles.terms}>
            By creating an account, you agree to the{" "}
            <Link href="/pricing">Terms and Conditions</Link>
          </p>
        ) : null}

        <span className={styles.assistiveCopy}>
          {title} {subtitle}
        </span>
      </section>

      {!isVerifyStep ? <LegacyVisualPanel mode={mode} /> : null}
    </main>
  );
}
