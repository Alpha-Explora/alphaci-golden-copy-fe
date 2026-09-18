"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getEduSession,
  logoutEdu,
  selectEduLab,
} from "../data/edu-auth-api";
import {
  eduAuthErrorMessage,
  errorStatus,
  isAuthenticatedEduSession,
} from "../model/edu-session-rules";
import type {
  EduAuthenticatedSession,
  EduSessionStatus,
} from "../model/edu-session-types";

function projectEduSession(session: EduAuthenticatedSession | null) {
  if (!session) {
    return {
      github: { linked: false, login: null },
      labs: [],
      role: null,
      selectedLabId: null,
      session: null,
      user: null,
    };
  }

  return {
    github: session.github,
    labs: session.labs,
    role: session.user.role,
    selectedLabId: session.selectedLabId,
    session,
    user: session.user,
  };
}

export function useEduSessionViewModel() {
  const [session, setSession] = useState<EduAuthenticatedSession | null>(null);
  const [status, setStatus] = useState<EduSessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setStatus("loading");
    setError(null);

    try {
      const response = await getEduSession();
      if (currentRequest !== requestId.current) return;

      const authenticated = isAuthenticatedEduSession(response);
      setSession(authenticated ? response : null);
      setStatus(authenticated ? "ready" : "signed-out");
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setSession(null);
      if (errorStatus(caught) === 401) {
        setStatus("signed-out");
        return;
      }
      setStatus("error");
      setError(eduAuthErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  const selectLab = useCallback(async (labId: string) => {
    if (!session) return;

    const currentRequest = ++requestId.current;
    setStatus("selecting");
    setError(null);

    try {
      const response = await selectEduLab(labId);
      if (currentRequest !== requestId.current) return;
      setSession((current) =>
        current
          ? {
              ...current,
              labs: response.labs,
              selectedLabId: response.selectedLabId,
            }
          : current,
      );
      setStatus("ready");
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setStatus("error");
      setError(eduAuthErrorMessage(caught));
    }
  }, [session]);

  const signOut = useCallback(async () => {
    ++requestId.current;
    setSession(null);
    setError(null);
    setStatus("signed-out");
    await logoutEdu().catch(() => undefined);
  }, []);

  const projected = projectEduSession(session);

  return {
    ...projected,
    status,
    error,
    refresh,
    selectLab,
    signOut,
  };
}
