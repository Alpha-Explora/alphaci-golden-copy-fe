import type {
  EduAuthenticatedSession,
  EduRole,
  EduSessionResponse,
} from "./edu-session-types";

const SAFE_PATH = /^\/(?!\/)/;

export function isStaffEduRole(role: EduRole | null | undefined): boolean {
  return role !== null && role !== undefined && role !== "STUDENT";
}

export function isAuthenticatedEduSession(
  response: EduSessionResponse | null | undefined,
): response is EduAuthenticatedSession {
  return Boolean(response?.authenticated && response.user);
}

export function safeEduRedirect(
  value: string | null | undefined,
  fallback = "/home",
): string {
  return value && SAFE_PATH.test(value) ? value : fallback;
}

export function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

export function errorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const directCode = (error as { code?: unknown }).code;
  if (typeof directCode === "string") return directCode;

  const details = (error as { details?: unknown }).details;
  if (!details || typeof details !== "object") return null;
  const detailsCode = (details as { code?: unknown }).code;
  return typeof detailsCode === "string" ? detailsCode : null;
}

export function errorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const details = (error as { details?: unknown }).details;
  if (details && typeof details === "object") {
    const message = (details as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return message.join(", ");
    }
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export function eduAuthErrorMessage(error: unknown): string {
  const status = errorStatus(error);
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status === 503) return "EDU authentication is temporarily unavailable. Try again shortly.";
  if (status === 401 || status === 403) {
    return "Your EDU session is no longer active. Please sign in again.";
  }
  return "We could not reach the EDU authentication service. Please try again.";
}
