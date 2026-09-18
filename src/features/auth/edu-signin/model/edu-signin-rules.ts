import type { EduAudience } from "@/features/auth/edu-session";

export function validateEduSignIn(
  email: string,
  password: string,
): string | null {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return "Enter a valid email address.";
  }
  if (!password) return "Enter your password.";
  return null;
}

export function wrongDoorRoute(audience: EduAudience): string {
  return audience === "STUDENT" ? "/signin/staff" : "/signin";
}

export function audienceLabel(audience: EduAudience): string {
  return audience === "STUDENT" ? "student" : "staff";
}
