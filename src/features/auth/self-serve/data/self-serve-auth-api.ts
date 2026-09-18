import { getApiBaseUrl, request } from "@/shared/api/request";

import type {
  SelfServeAuthResponse,
  VerificationRequiredResponse,
} from "../model/self-serve-types";

function oauthUrl(provider: "github" | "google", returnTo: string): string {
  return (
    getApiBaseUrl() +
    "/auth/" +
    provider +
    "/start?returnTo=" +
    encodeURIComponent(returnTo)
  );
}

export function createSelfServeGitHubLoginUrl(returnTo: string): string {
  return oauthUrl("github", returnTo);
}

export function createGoogleLoginUrl(returnTo: string): string {
  return oauthUrl("google", returnTo);
}

export function loginWithEmail(
  email: string,
  password: string,
): Promise<SelfServeAuthResponse> {
  return request<SelfServeAuthResponse>("/auth/email/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function startEmailSignup(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<VerificationRequiredResponse> {
  return request<VerificationRequiredResponse>("/auth/email/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmailSignupCode(
  email: string,
  code: string,
): Promise<SelfServeAuthResponse> {
  return request<SelfServeAuthResponse>("/auth/email/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resendEmailSignupCode(
  email: string,
): Promise<VerificationRequiredResponse> {
  return request<VerificationRequiredResponse>("/auth/email/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function claimSessionHandoff(token: string): Promise<void> {
  await request<{ ok: true; auth: "success" }>("/auth/session/claim", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
