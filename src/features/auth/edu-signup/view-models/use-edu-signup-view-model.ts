"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";

import {
  eduAuthErrorMessage,
  eduStudentSignup,
  errorMessage,
} from "@/features/auth/edu-session";

import { validateEduSignup } from "../model/edu-signup-rules";

type EduSignupStatus = "idle" | "loading" | "created" | "error";

export function useEduSignupViewModel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<EduSignupStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "loading") return;

      const validationError = validateEduSignup(email, password);
      if (validationError) {
        setStatus("error");
        setMessage(validationError);
        return;
      }

      setStatus("loading");
      setMessage(null);

      try {
        const response = await eduStudentSignup({
          email: email.trim(),
          password,
        });
        if (!response.created) {
          setStatus("error");
          setMessage(response.message || "We could not create your account.");
          return;
        }
        setNeedsEmailConfirmation(response.needsEmailConfirmation);
        setStatus("created");
      } catch (caught) {
        setStatus("error");
        setMessage(
          errorMessage(caught) ?? eduAuthErrorMessage(caught),
        );
      }
    },
    [email, password, status],
  );

  return {
    email,
    password,
    setEmail,
    setPassword,
    status,
    message,
    needsEmailConfirmation,
    submit,
  };
}
