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
  loginWithEmail,
} from "../data/self-serve-auth-api";
import type { SelfServeLoginStatus } from "../model/self-serve-types";

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/home";
}

function messageForError(error: unknown): string {
  const status = authErrorStatus(error);
  if (status === 401 || status === 403) return "The email or password is not correct.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status === 503) return "Email sign-in is temporarily unavailable. Try a provider sign-in.";
  return "We could not sign you in. Please try again.";
}

export function useSelfServeLoginViewModel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const browserOrigin =
    typeof window === "undefined" ? null : window.location.origin;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SelfServeLoginStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [providerLoading, setProviderLoading] = useState<"github" | "google" | null>(null);
  const { status: sessionStatus, session, refresh } = useAuthSession();

  useEffect(() => {
    if (sessionStatus !== "signed-in" || !session) return;
    router.replace(getAuthenticatedRedirectPath(session, nextPath) ?? nextPath);
  }, [nextPath, router, session, sessionStatus]);

  const callbackReturnTo = useMemo(() => {
    const query = new URLSearchParams({
      intent: "login",
      next: nextPath,
      provider: "github",
    });
    return (browserOrigin ?? "") + "/auth/callback?" + query.toString();
  }, [browserOrigin, nextPath]);

  const googleCallbackReturnTo = useMemo(() => {
    const query = new URLSearchParams({
      intent: "login",
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

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      setMessage(null);
      try {
        await loginWithEmail(email.trim(), password);
        const current = await getCurrentSession();
        await refresh();
        router.replace(getAuthenticatedRedirectPath(current, nextPath) ?? nextPath);
      } catch (error) {
        setStatus("error");
        setMessage(messageForError(error));
      }
    },
    [email, nextPath, password, refresh, router, status],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    status,
    message,
    providerLoading,
    nextPath,
    submit,
    signInWithProvider,
  };
}
