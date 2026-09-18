"use client";

import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  eduLogin,
  eduAuthErrorMessage,
  errorCode,
  errorMessage,
  errorStatus,
  safeEduRedirect,
  type EduAudience,
} from "@/features/auth/edu-session";

import {
  audienceLabel,
  validateEduSignIn,
  wrongDoorRoute,
} from "../model/edu-signin-rules";

type EduSignInStatus = "idle" | "loading" | "error";

function messageForError(error: unknown, audience: EduAudience): string {
  if (errorCode(error) === "WRONG_SIGN_IN_DOOR") {
    return `Those credentials belong to the ${audience === "STUDENT" ? "staff" : "student"} sign-in door.`;
  }

  const status = errorStatus(error);
  if (status === 401) return "The email or password is not correct.";
  if (status === 403) {
    return errorMessage(error) ?? `This account cannot use the ${audienceLabel(audience)} door.`;
  }
  return eduAuthErrorMessage(error);
}

export function useEduSignInViewModel(audience: EduAudience) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => safeEduRedirect(searchParams.get("next"), "/home"),
    [searchParams],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<EduSignInStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;

      const validationError = validateEduSignIn(email, password);
      if (validationError) {
        setStatus("error");
        setError(validationError);
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await eduLogin({
          email: email.trim(),
          password,
          audience,
        });
        if (!response.authenticated || !response.user) {
          setStatus("error");
          setError("The EDU session was not established. Please try again.");
          return;
        }
        router.replace(safeEduRedirect(response.redirectTo, nextPath));
      } catch (caught) {
        setStatus("error");
        setError(messageForError(caught, audience));
      }
    },
    [audience, email, nextPath, password, router, status],
  );

  return {
    audience,
    email,
    password,
    setEmail,
    setPassword,
    status,
    error,
    submit,
    wrongDoorRoute: wrongDoorRoute(audience),
  };
}
