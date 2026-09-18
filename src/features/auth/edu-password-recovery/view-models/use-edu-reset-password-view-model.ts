"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  eduAuthErrorMessage,
  eduCompletePasswordReset,
  errorMessage,
} from "@/features/auth/edu-session";

import {
  parseEduResetFragment,
  validateEduNewPassword,
  type EduResetLinkState,
} from "../model/edu-password-recovery-rules";

type EduResetStatus = "checking" | "ready" | "saving" | "saved" | "unusable" | "error";

export function useEduResetPasswordViewModel() {
  const [link, setLink] = useState<EduResetLinkState | null>(null);
  const [status, setStatus] = useState<EduResetStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const parsed = parseEduResetFragment(window.location.hash);
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      setLink(parsed);
      setStatus(parsed.kind);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "saving" || status === "saved") return;

      if (!link || link.kind !== "ready") {
        setStatus("unusable");
        setError("This link is no longer usable. Request a new email.");
        return;
      }

      const validationError = validateEduNewPassword(password, confirmPassword);
      if (validationError) {
        setStatus("error");
        setError(validationError);
        return;
      }

      setStatus("saving");
      setError(null);
      try {
        const response = await eduCompletePasswordReset(link.accessToken, password);
        if (!response.ok) {
          setStatus("unusable");
          setError(response.message);
          setLink({ kind: "unusable", reason: response.message });
          return;
        }
        setStatus("saved");
      } catch (caught) {
        setStatus("error");
        setError(errorMessage(caught) ?? eduAuthErrorMessage(caught));
      }
    },
    [confirmPassword, link, password, status],
  );

  return {
    link,
    status,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    error,
    submit,
  };
}
