"use client";

import Link from "next/link";

import { EduAuthShell } from "@/features/auth/edu-signin";

import { useEduResetPasswordViewModel } from "../view-models/use-edu-reset-password-view-model";

type EduResetPasswordViewModel = ReturnType<typeof useEduResetPasswordViewModel>;

function EduResetPasswordForm({ vm }: Readonly<{ vm: EduResetPasswordViewModel }>) {
  return (
    <form className="auth-self-serve-form" noValidate onSubmit={vm.submit}>
      {vm.error ? <p className="error-text auth-self-serve-message" role="alert">{vm.error}</p> : null}
      <label className="auth-self-serve-field" htmlFor="edu-reset-password">
        <span>New password</span>
        <input
          autoComplete="new-password"
          id="edu-reset-password"
          onChange={(event) => vm.setPassword(event.target.value)}
          required
          type="password"
          value={vm.password}
        />
        <small>Use at least 8 characters.</small>
      </label>
      <label className="auth-self-serve-field" htmlFor="edu-reset-confirm-password">
        <span>Confirm new password</span>
        <input
          autoComplete="new-password"
          id="edu-reset-confirm-password"
          onChange={(event) => vm.setConfirmPassword(event.target.value)}
          required
          type="password"
          value={vm.confirmPassword}
        />
      </label>
      <button className="primary-button auth-self-serve-submit" disabled={vm.status === "saving"} type="submit">
        {vm.status === "saving" ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

function EduResetPasswordBody({
  isInvite,
  isSaved,
  vm,
}: Readonly<{ isInvite: boolean; isSaved: boolean; vm: EduResetPasswordViewModel }>) {
  return (
    <>
      {vm.status === "checking" ? <p className="helper-text">One moment…</p> : null}

      {vm.status === "unusable" ? (
        <div className="auth-self-serve-form">
          <p className="error-text" role="alert">
            {vm.link?.kind === "unusable" ? vm.link.reason : vm.error}
          </p>
          <p className="helper-text">These links expire and can only be used once. Open the newest email.</p>
          <Link href="/signin/forgot-password">Send me a new link</Link>
        </div>
      ) : null}

      {isSaved ? (
        <div className="auth-self-serve-form" role="status">
          <p className="helper-text">Sign in with the email address and password you just chose.</p>
          <Link className="primary-button auth-self-serve-submit" href={isInvite ? "/signin/staff" : "/signin"}>
            Continue to sign in
          </Link>
        </div>
      ) : null}

      {vm.status === "ready" || vm.status === "saving" || vm.status === "error" ? (
        <EduResetPasswordForm vm={vm} />
      ) : null}
    </>
  );
}

export function EduResetPasswordView() {
  const vm = useEduResetPasswordViewModel();
  const isInvite = vm.link?.kind === "ready" && vm.link.isInvite;
  const isSaved = vm.status === "saved";

  let title = "Set a new password";
  let subtitle = "Choose something you have not used here before.";
  if (isInvite) {
    title = "Choose your password";
    subtitle = "This is the last step of your invitation.";
  }
  if (isSaved) {
    title = "Your password is set";
    subtitle = "You can sign in with it now.";
  }

  return (
    <EduAuthShell
      copy="Recovery and invitation links are handled by the EDU authentication service and never expose a provider token to the server-rendered page."
      eyebrow="Account access"
      footer={
        <p className="auth-switch-text">
          <Link href="/signin/staff">Staff sign in</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/signin">Student sign in</Link>
        </p>
      }
      title={title}
    >
      <h1>{title}</h1>
      <p className="auth-subtitle">{vm.status === "checking" ? "Checking your link…" : subtitle}</p>
      <EduResetPasswordBody isInvite={isInvite} isSaved={isSaved} vm={vm} />
    </EduAuthShell>
  );
}
