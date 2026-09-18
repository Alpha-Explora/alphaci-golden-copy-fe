"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ProviderButtons, SelfServeAuthShell } from "./self-serve-auth-shell";
import { useSelfServeSignupViewModel } from "../view-models/use-self-serve-signup-view-model";

type SignupViewModel = ReturnType<typeof useSelfServeSignupViewModel>;

function signupHeading(
  step: SignupViewModel["step"],
  email: string,
): { title: string; subtitle: string } {
  switch (step) {
    case "verify":
      return {
        title: "Verify your email.",
        subtitle: `Enter the six-digit code we sent to ${email}.`,
      };
    case "password":
      return {
        title: "Secure your account.",
        subtitle: "A few details now, then you can start shaping your workspace.",
      };
    default:
      return {
        title: "Create your AlphaCI account.",
        subtitle: "A few details now, then you can start shaping your workspace.",
      };
  }
}

function SignupStepContent({ vm }: Readonly<{ vm: SignupViewModel }>): ReactNode {
  const isLoading = vm.status === "loading";

  switch (vm.step) {
    case "identity":
      return (
        <>
          <form className="auth-self-serve-form" onSubmit={vm.submitIdentity}>
            <div className="auth-self-serve-name-grid">
              <label className="auth-self-serve-field" htmlFor="self-serve-first-name">
                <span>First name</span>
                <input
                  autoComplete="given-name"
                  id="self-serve-first-name"
                  onChange={(event) => vm.setFirstName(event.target.value)}
                  required
                  value={vm.firstName}
                />
              </label>
              <label className="auth-self-serve-field" htmlFor="self-serve-last-name">
                <span>Last name</span>
                <input
                  autoComplete="family-name"
                  id="self-serve-last-name"
                  onChange={(event) => vm.setLastName(event.target.value)}
                  required
                  value={vm.lastName}
                />
              </label>
            </div>
            <label className="auth-self-serve-field" htmlFor="self-serve-signup-email">
              <span>Email address</span>
              <input
                autoComplete="email"
                id="self-serve-signup-email"
                onChange={(event) => vm.setEmail(event.target.value)}
                required
                type="email"
                value={vm.email}
              />
            </label>
            <button className="primary-button auth-self-serve-submit" type="submit">
              Continue
            </button>
          </form>
          <div className="auth-self-serve-divider">
            <span />or<span />
          </div>
          <ProviderButtons loading={vm.providerLoading} onProvider={vm.signInWithProvider} signup />
          <p className="auth-switch-text">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </>
      );
    case "password":
      return (
        <form className="auth-self-serve-form" onSubmit={(event) => void vm.submitPassword(event)}>
          <label className="auth-self-serve-field" htmlFor="self-serve-signup-password">
            <span>Create password</span>
            <input
              autoComplete="new-password"
              id="self-serve-signup-password"
              minLength={8}
              onChange={(event) => vm.setPassword(event.target.value)}
              required
              type="password"
              value={vm.password}
            />
            <small>Use at least 8 characters.</small>
          </label>
          <button className="primary-button auth-self-serve-submit" disabled={isLoading} type="submit">
            {isLoading ? "Preparing verification…" : "Create account"}
          </button>
        </form>
      );
    case "verify":
      return (
        <form className="auth-self-serve-form" onSubmit={(event) => void vm.verify(event)}>
          <label className="auth-self-serve-field" htmlFor="self-serve-verification-code">
            <span>Verification code</span>
            <input
              autoComplete="one-time-code"
              id="self-serve-verification-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => vm.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              pattern="\d{6}"
              required
              value={vm.code}
            />
          </label>
          <button
            className="primary-button auth-self-serve-submit"
            disabled={isLoading || vm.code.length !== 6}
            type="submit"
          >
            {isLoading ? "Verifying…" : "Verify and finish"}
          </button>
          <button
            className="auth-self-serve-resend"
            disabled={vm.resendCooldown > 0 || isLoading}
            onClick={() => void vm.resend()}
            type="button"
          >
            {vm.resendCooldown > 0
              ? `Resend code in ${vm.resendCooldown}s`
              : "Resend code"}
          </button>
        </form>
      );
  }
}

export function SelfServeSignupView() {
  const vm = useSelfServeSignupViewModel();
  const heading = signupHeading(vm.step, vm.email);

  return (
    <SelfServeAuthShell
      eyebrow={vm.step === "verify" ? "Almost there" : "Start building"}
      title="A clearer path from idea to release."
      copy="Create a workspace for your team and put your delivery standards in one place. Billing can be connected later."
    >
      <button
        className="auth-self-serve-back"
        disabled={vm.step === "identity"}
        onClick={() => vm.setStep(vm.step === "verify" ? "password" : "identity")}
        type="button"
      >
        ← Back
      </button>
      <h1>{heading.title}</h1>
      <p className="auth-subtitle">{heading.subtitle}</p>

      <SignupStepContent vm={vm} />

      {vm.message ? (
        <p className="error-text auth-self-serve-message" role="alert">
          {vm.message}
        </p>
      ) : null}
    </SelfServeAuthShell>
  );
}
