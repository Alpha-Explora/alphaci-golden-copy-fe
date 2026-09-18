"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";

import {
  eduAuthErrorMessage,
  eduRequestPasswordReset,
  errorMessage,
} from "@/features/auth/edu-session";

type EduForgotPasswordStatus = "idle" | "loading" | "sent" | "error";

export function useEduForgotPasswordViewModel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<EduForgotPasswordStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;

      const normalizedEmail = email.trim();
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setStatus("error");
        setError("Enter the email address you sign in with.");
        return;
      }

      setStatus("loading");
      setError(null);
      try {
        await eduRequestPasswordReset(normalizedEmail);
        setStatus("sent");
      } catch (caught) {
        setStatus("error");
        setError(errorMessage(caught) ?? eduAuthErrorMessage(caught));
      }
    },
    [email, status],
  );

  return { email, setEmail, status, error, submit };
}
