"use client";

import Link from "next/link";

import { SelfServeAuthShell, ProviderButtons } from "./self-serve-auth-shell";
import { useSelfServeLoginViewModel } from "../view-models/use-self-serve-login-view-model";

export function SelfServeLoginView() {
  const vm = useSelfServeLoginViewModel();

  return (
    <SelfServeAuthShell
      eyebrow="Welcome back"
      title="Make delivery feel deliberate."
      copy="AlphaCI turns the path from commit to deployment into a visible, governed workflow your team can trust."
    >
      <h1>Sign in to AlphaCI.</h1>
      <p className="auth-subtitle">
        Use your email, GitHub, or Google account to continue.
      </p>

      <form className="auth-self-serve-form" onSubmit={(event) => void vm.submit(event)}>
        <label className="auth-self-serve-field" htmlFor="self-serve-login-email">
          <span>Email address</span>
          <input
            autoComplete="email"
            id="self-serve-login-email"
            name="email"
            onChange={(event) => vm.setEmail(event.target.value)}
            required
            type="email"
            value={vm.email}
          />
        </label>
        <label className="auth-self-serve-field" htmlFor="self-serve-login-password">
          <span>Password</span>
          <input
            autoComplete="current-password"
            id="self-serve-login-password"
            minLength={8}
            name="password"
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

      <div className="auth-self-serve-divider"><span />or<span /></div>
      <ProviderButtons loading={vm.providerLoading} onProvider={vm.signInWithProvider} />

      {vm.message ? <p className="error-text auth-self-serve-message" role="alert">{vm.message}</p> : null}
      <p className="auth-switch-text">
        New to AlphaCI? <Link href={"/signup?next=" + encodeURIComponent(vm.nextPath)}>Create an account</Link>
      </p>
    </SelfServeAuthShell>
  );
}
