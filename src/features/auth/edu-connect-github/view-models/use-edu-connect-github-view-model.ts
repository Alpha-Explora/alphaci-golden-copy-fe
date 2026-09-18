"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  createEduGithubLinkUrl,
  safeEduRedirect,
  useEduSessionViewModel,
} from "@/features/auth/edu-session";

import { canConnectEduGithub } from "../model/edu-connect-github-rules";

export function useEduConnectGithubViewModel() {
  const router = useRouter();
  const session = useEduSessionViewModel();
  const canConnect = canConnectEduGithub(session.role);

  useEffect(() => {
    if (session.status === "idle" || session.status === "loading") return;
    if (session.status === "signed-out") {
      router.replace("/signin/staff");
      return;
    }
    if (session.status === "ready" && !canConnect) {
      router.replace("/home");
    }
  }, [canConnect, router, session.status]);

  const connect = useCallback(() => {
    if (!canConnect || typeof window === "undefined") return;
    window.location.assign(createEduGithubLinkUrl("/connect-github"));
  }, [canConnect]);

  const skip = useCallback(() => {
    router.replace(safeEduRedirect(session.session?.redirectTo, "/home"));
  }, [router, session.session?.redirectTo]);

  return {
    ...session,
    canConnect,
    isResolving: session.status === "idle" || session.status === "loading",
    connect,
    skip,
  };
}
