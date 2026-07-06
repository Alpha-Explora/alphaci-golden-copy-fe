import type { AuthMeResponse, PendingAccountResponse } from "./contracts";
import { getApiBaseUrl, request } from "./request";

export function createGitHubLoginUrl(returnTo: string): string {
  return `${getApiBaseUrl()}/auth/github/start?returnTo=${encodeURIComponent(returnTo)}`;
}
export function createGoogleLoginUrl(returnTo: string): string {
  return `${getApiBaseUrl()}/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

export interface EmailSignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface EmailLoginInput {
  email: string;
  password: string;
}

export async function startEmailSignup(input: EmailSignupInput): Promise<{ ok: true; verificationRequired: true }> {
  return request<{ ok: true; verificationRequired: true }>("/auth/email/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyEmailSignupCode(input: {
  email: string;
  code: string;
}): Promise<{ ok: true; authenticated: true; user: AuthMeResponse["user"] }> {
  return request<{ ok: true; authenticated: true; user: AuthMeResponse["user"] }>("/auth/email/verify-code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginWithEmail(input: EmailLoginInput): Promise<{ ok: true; authenticated: true; user: AuthMeResponse["user"] }> {
  return request<{ ok: true; authenticated: true; user: AuthMeResponse["user"] }>("/auth/email/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resendEmailSignupCode(email: string): Promise<{ ok: true; verificationRequired: true }> {
  return request<{ ok: true; verificationRequired: true }>("/auth/email/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getAuthSession(): Promise<AuthMeResponse> {
  return request<AuthMeResponse>("/auth/me");
}

export async function logout(): Promise<void> {
  await request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function deleteAccount(): Promise<void> {
  await request<{ ok: boolean }>("/auth/account", {
    method: "DELETE",
  });
}

export async function completeOnboarding(): Promise<{ ok: boolean; onboardingCompleted: boolean }> {
  return request<{ ok: boolean; onboardingCompleted: boolean }>("/auth/onboarding/complete", {
    method: "POST",
  });
}

export async function getPendingAccount(): Promise<PendingAccountResponse> {
  return request<PendingAccountResponse>("/auth/account/pending");
}

export async function restoreAccount(): Promise<{ ok: boolean; restored: boolean }> {
  return request<{ ok: boolean; restored: boolean }>("/auth/account/restore", {
    method: "POST",
  });
}

export async function startFreshAccount(): Promise<{ ok: boolean; created: boolean }> {
  return request<{ ok: boolean; created: boolean }>("/auth/account/start-fresh", {
    method: "POST",
  });
}

export async function warmupBackend(): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    await fetch(`${getApiBaseUrl()}/health`, { signal: controller.signal });
  } catch {
    // Intentionally swallowed — we only want the server to wake up.
  } finally {
    clearTimeout(timer);
  }
}
