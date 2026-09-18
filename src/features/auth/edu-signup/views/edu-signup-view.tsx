"use client";

import Link from "next/link";

import { EduAuthShell } from "@/features/auth/edu-signin";

import { EDU_MIN_PASSWORD_LENGTH } from "../model/edu-signup-rules";
import { useEduSignupViewModel } from "../view-models/use-edu-signup-view-model";

export function EduSignupView() {
  const vm = useEduSignupViewModel();

  return (
    <EduAuthShell
      copy="Create credentials with your school email. You do not need a teacher to add you before your first sign in."
      eyebrow="New student"
      footer={
        <p className="auth-switch-text">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      }
      title={vm.status === "created" ? "Almost ready to learn." : "Start with your school email."}
    >
      <h1>{vm.status === "created" ? "Check your email" : "Create a student account"}</h1>
      <p className="auth-subtitle">
        {vm.status === "created"
          ? vm.needsEmailConfirmation
            ? `Open the confirmation link sent to ${vm.email}, then return here to sign in.`
            : `Your account is ready. Sign in with ${vm.email}.`
          : "Your school domain is checked by the EDU service."}
      </p>

      {vm.status === "created" ? (
        <div className="auth-self-serve-form" role="status">
          <p className="helper-text">
            {vm.needsEmailConfirmation
              ? "The link expires shortly. If it goes stale, request another one from the password-help screen."
              : "You can continue to the student sign-in door now."}
          </p>
          <Link className="primary-button auth-self-serve-submit" href="/signin">
            Go to student sign in
          </Link>
        </div>
      ) : (
        <form className="auth-self-serve-form" noValidate onSubmit={vm.submit}>
          {vm.message ? <p className="error-text auth-self-serve-message" role="alert">{vm.message}</p> : null}
          <label className="auth-self-serve-field" htmlFor="edu-signup-email">
            <span>School email</span>
            <input
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              id="edu-signup-email"
              inputMode="email"
              onChange={(event) => vm.setEmail(event.target.value)}
              placeholder="you@school.edu"
              required
              spellCheck={false}
              type="email"
              value={vm.email}
            />
          </label>
          <label className="auth-self-serve-field" htmlFor="edu-signup-password">
            <span>Choose a password</span>
            <input
              autoComplete="new-password"
              id="edu-signup-password"
              minLength={EDU_MIN_PASSWORD_LENGTH}
              onChange={(event) => vm.setPassword(event.target.value)}
              required
              type="password"
              value={vm.password}
            />
            <small>Use at least {EDU_MIN_PASSWORD_LENGTH} characters.</small>
          </label>
          <button className="primary-button auth-self-serve-submit" disabled={vm.status === "loading"} type="submit">
            {vm.status === "loading" ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}
    </EduAuthShell>
  );
}
