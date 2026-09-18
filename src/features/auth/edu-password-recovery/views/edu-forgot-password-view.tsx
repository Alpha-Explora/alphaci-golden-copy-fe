"use client";

import Link from "next/link";

import { EduAuthShell } from "@/features/auth/edu-signin";

import { useEduForgotPasswordViewModel } from "../view-models/use-edu-forgot-password-view-model";

export function EduForgotPasswordView() {
  const vm = useEduForgotPasswordViewModel();
  const sent = vm.status === "sent";

  return (
    <EduAuthShell
      copy="We will send a recovery link without revealing whether an address is registered."
      eyebrow="Password help"
      footer={
        <p className="auth-switch-text">
          <Link href="/signin">Student sign in</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/signin/staff">Staff sign in</Link>
        </p>
      }
      title={sent ? "A safer way back in." : "Reset your password."}
    >
      <h1>{sent ? "Check your email" : "Reset your password"}</h1>
      <p className="auth-subtitle">
        {sent ? "If that address is on file, a reset link is on its way." : "Enter the email you use for EDU sign in."}
      </p>

      {sent ? (
        <div className="auth-self-serve-form" role="status">
          <p className="helper-text">
            Open the newest link to choose a new password. It expires shortly;
            request another if it goes stale.
          </p>
          <Link className="primary-button auth-self-serve-submit" href="/signin">
            Back to student sign in
          </Link>
        </div>
      ) : (
        <form className="auth-self-serve-form" noValidate onSubmit={vm.submit}>
          {vm.error ? <p className="error-text auth-self-serve-message" role="alert">{vm.error}</p> : null}
          <label className="auth-self-serve-field" htmlFor="edu-forgot-email">
            <span>School email</span>
            <input
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              id="edu-forgot-email"
              inputMode="email"
              onChange={(event) => vm.setEmail(event.target.value)}
              placeholder="you@school.edu"
              required
              spellCheck={false}
              type="email"
              value={vm.email}
            />
          </label>
          <button className="primary-button auth-self-serve-submit" disabled={vm.status === "loading"} type="submit">
            {vm.status === "loading" ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </EduAuthShell>
  );
}
