"use client";

import Link from "next/link";

import type { EduAudience } from "@/features/auth/edu-session";

import { audienceLabel } from "../model/edu-signin-rules";
import { useEduSignInViewModel } from "../view-models/use-edu-signin-view-model";
import { EduAuthShell } from "./edu-auth-shell";

type EduSignInViewModel = ReturnType<typeof useEduSignInViewModel>;

function eduSignInCopy(audience: EduAudience) {
  const isStudent = audience === "STUDENT";
  return {
    copy: isStudent
      ? "Use your school email to enter the student workspace and continue your lab work."
      : "Staff sign in with the school account assigned to your teaching or administration role.",
    footerPrompt: isStudent ? "Are you staff?" : "Are you a student?",
    footerLink: isStudent ? "Use the staff door" : "Use the student door",
    title: isStudent ? "Learn by shipping real work." : "Guide the work that ships.",
  };
}

function EduSignInForm({
  audience,
  vm,
}: Readonly<{ audience: EduAudience; vm: EduSignInViewModel }>) {
  const isStudent = audience === "STUDENT";
  const audienceId = audience.toLowerCase();

  return (
    <form className="auth-self-serve-form" noValidate onSubmit={vm.submit}>
      <label className="auth-self-serve-field" htmlFor={`edu-${audienceId}-email`}>
        <span>{isStudent ? "School email" : "Work email"}</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          id={`edu-${audienceId}-email`}
          inputMode="email"
          onChange={(event) => vm.setEmail(event.target.value)}
          placeholder="you@school.edu"
          required
          spellCheck={false}
          type="email"
          value={vm.email}
        />
      </label>
      <label className="auth-self-serve-field" htmlFor={`edu-${audienceId}-password`}>
        <span>Password</span>
        <input
          autoComplete="current-password"
          id={`edu-${audienceId}-password`}
          onChange={(event) => vm.setPassword(event.target.value)}
          required
          type="password"
          value={vm.password}
        />
      </label>
      <button className="primary-button auth-self-serve-submit" disabled={vm.status === "loading"} type="submit">
        {vm.status === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function EduSignInFooter({
  audience,
  link,
  prompt,
}: Readonly<{ audience: EduAudience; link: string; prompt: string }>) {
  return (
    <p className="auth-switch-text">
      {prompt}{" "}
      <Link href={link}>{audience === "STUDENT" ? "Use the staff door" : "Use the student door"}</Link>
    </p>
  );
}

export function EduSignInView({
  audience,
}: Readonly<{ audience: EduAudience }>) {
  const vm = useEduSignInViewModel(audience);
  const isStudent = audience === "STUDENT";
  const copy = eduSignInCopy(audience);

  return (
    <EduAuthShell
      copy={copy.copy}
      eyebrow={`${audienceLabel(audience)} sign in`}
      footer={
        <EduSignInFooter audience={audience} link={vm.wrongDoorRoute} prompt={copy.footerPrompt} />
      }
      title={copy.title}
    >
      <h1>{isStudent ? "Student sign in" : "Staff sign in"}</h1>
      <p className="auth-subtitle">
        Enter your EDU email and password to continue.
      </p>

      <EduSignInForm audience={audience} vm={vm} />

      {vm.error ? <p className="error-text auth-self-serve-message" role="alert">{vm.error}</p> : null}

      <p className="auth-switch-text">
        <Link href="/signin/forgot-password">Forgot your password?</Link>
        {isStudent ? (
          <>
            <span aria-hidden="true"> · </span>
            <Link href="/signin/create-account">Create a student account</Link>
          </>
        ) : null}
      </p>
    </EduAuthShell>
  );
}
