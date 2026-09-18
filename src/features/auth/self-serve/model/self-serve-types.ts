import type { AuthMeResponse } from "@/shared/api/contracts";

export type SelfServeLoginStatus = "idle" | "loading" | "error";

export type SelfServeSignupStep = "identity" | "password" | "verify";

export type SelfServeSignupStatus = "idle" | "loading" | "error";

export interface SelfServeAuthResponse {
  ok: true;
  authenticated: true;
  user: AuthMeResponse["user"];
}

export interface VerificationRequiredResponse {
  ok: true;
  verificationRequired: true;
}
