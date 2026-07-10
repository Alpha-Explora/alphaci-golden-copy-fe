"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, getAuthSession } from "@/lib/api/client";
import type { AuthMeResponse } from "@/lib/api/contracts";

export const AUTH_SESSION_TIMEOUT_MS = 8_000;

class AuthSessionTimeoutError extends Error {
  constructor() {
    super("Session check timed out.");
    this.name = "AuthSessionTimeoutError";
  }
}

async function getAuthSessionWithTimeout() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new AuthSessionTimeoutError()), AUTH_SESSION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([getAuthSession(), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
export type AuthSessionStatus = "loading" | "signed-out" | "signed-in" | "error";

interface UseAuthSessionResult {
  status: AuthSessionStatus;
  session: AuthMeResponse | null;
  error: string | null;
  refresh: () => Promise<AuthMeResponse | null>;
}

function getFriendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Please sign in with GitHub to continue.";
    }

    return `Session check failed with status ${error.status}.`;
  }

  return "Unable to verify your session right now.";
}

export function useAuthSession(): UseAuthSessionResult {
  const [status, setStatus] = useState<AuthSessionStatus>("loading");
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestVersionRef = useRef(0);

  const applySession = useCallback((current: AuthMeResponse) => {
    if (!current.authenticated) {
      setSession(null);
      setStatus("signed-out");
      setError(null);
      return;
    }

    setSession(current);
    setStatus("signed-in");
    setError(null);
  }, []);

  const refresh = useCallback(async (): Promise<AuthMeResponse | null> => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    setStatus("loading");
    setError(null);

    try {
      const current = await getAuthSessionWithTimeout();

      if (requestVersion !== requestVersionRef.current) {
        return current.authenticated ? current : null;
      }

      applySession(current);
      return current.authenticated ? current : null;
    } catch (cause) {
      if (requestVersion !== requestVersionRef.current) {
        return null;
      }

      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        setSession(null);
        setStatus("signed-out");
        return null;
      }

      setSession(null);
      setStatus("error");
      setError(getFriendlyAuthError(cause));
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    let active = true;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    async function loadInitialSession() {
      try {
        const current = await getAuthSessionWithTimeout();

        if (!active || requestVersion !== requestVersionRef.current) {
          return;
        }

        applySession(current);
      } catch (cause) {
        if (!active || requestVersion !== requestVersionRef.current) {
          return;
        }

        if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
          setSession(null);
          setStatus("signed-out");
          return;
        }

        setSession(null);
        setStatus("error");
        setError(getFriendlyAuthError(cause));
      }
    }

    void loadInitialSession();

    return () => {
      active = false;
    };
  }, [applySession]);

  return {
    status,
    session,
    error,
    refresh,
  };
}
