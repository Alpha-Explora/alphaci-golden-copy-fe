"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  authErrorStatus,
  getAuthenticatedRedirectPath,
  getCurrentSession,
  useAuthSession,
} from "@/features/auth/session";

import {
  createGoogleLoginUrl,
  createSelfServeGitHubLoginUrl,
  resendEmailSignupCode,
  startEmailSignup,
  verifyEmailSignupCode,
} from "../data/self-serve-auth-api";
import type { SelfServeSignupStep, SelfServeSignupStatus } from "../model/self-serve-types";

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/home";
}

function messageForError(error: unknown): string {
  const status = authErrorStatus(error);
  if (status === 409) return "That email is already registered. Try signing in instead.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status === 503) return "Email verification is not configured yet. Try a provider sign-in.";
  return "We could not continue your signup. Please check the details and try again.";
}

export function useSelfServeSignupViewModel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const browserOrigin =
    typeof window === "undefined" ? null : window.location.origin;
  const [step, setStep] = useState<SelfServeSignupStep>("identity");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<SelfServeSignupStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [providerLoading, setProviderLoading] = useState<"github" | "google" | null>(null);
  const { status: sessionStatus, session, refresh } = useAuthSession();

  useEffect(() => {
    if (sessionStatus !== "signed-in" || !session) return;
    router.replace(getAuthenticatedRedirectPath(session, nextPath) ?? nextPath);
  }, [nextPath, router, session, sessionStatus]);

  useEffect(() => {
    if (step !== "verify" || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(
      () => setResendCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendCooldown, step]);

  const callbackReturnTo = useMemo(() => {
    const query = new URLSearchParams({
      intent: "signup",
      next: nextPath,
      provider: "github",
    });
    return (browserOrigin ?? "") + "/auth/callback?" + query.toString();
  }, [browserOrigin, nextPath]);

  const googleCallbackReturnTo = useMemo(() => {
    const query = new URLSearchParams({
      intent: "signup",
      next: nextPath,
      provider: "google",
    });
    return (browserOrigin ?? "") + "/auth/callback?" + query.toString();
  }, [browserOrigin, nextPath]);

  const signInWithProvider = useCallback(
    (provider: "github" | "google") => {
      setProviderLoading(provider);
      const returnTo =
        provider === "github" ? callbackReturnTo : googleCallbackReturnTo;
      window.location.assign(
        provider === "github"
          ? createSelfServeGitHubLoginUrl(returnTo)
          : createGoogleLoginUrl(returnTo),
      );
    },
    [callbackReturnTo, googleCallbackReturnTo],
  );

  const submitIdentity = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setStep("password");
    },
    [],
  );

  const submitPassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      setMessage(null);
      try {
        await startEmailSignup({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        });
        setResendCooldown(30);
        setStep("verify");
        setStatus("idle");
      } catch (error) {
        setStatus("error");
        setMessage(messageForError(error));
      }
    },
    [email, firstName, lastName, password, status],
  );

  const verify = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading" || code.trim().length !== 6) return;
      setStatus("loading");
      setMessage(null);
      try {
        await verifyEmailSignupCode(email.trim(), code.trim());
        const current = await getCurrentSession();
        await refresh();
        router.replace(getAuthenticatedRedirectPath(current, nextPath) ?? nextPath);
      } catch (error) {
        setStatus("error");
        setMessage(
          authErrorStatus(error) === 401
            ? "That code is invalid or expired."
            : messageForError(error),
        );
      }
    },
    [code, email, nextPath, refresh, router, status],
  );

  const resend = useCallback(async () => {
    if (resendCooldown > 0 || status === "loading") return;
    setStatus("loading");
    setMessage(null);
    try {
      await resendEmailSignupCode(email.trim());
      setResendCooldown(30);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(messageForError(error));
    }
  }, [email, resendCooldown, status]);

  return {
    step,
    setStep,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    code,
    setCode,
    status,
    message,
    resendCooldown,
    providerLoading,
    submitIdentity,
    submitPassword,
    verify,
    resend,
    signInWithProvider,
  };
}
