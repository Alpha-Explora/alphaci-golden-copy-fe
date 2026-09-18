import { EDU_MIN_PASSWORD_LENGTH } from "@/features/auth/edu-signup";

export type EduResetLinkState =
  | { kind: "ready"; accessToken: string; isInvite: boolean }
  | { kind: "unusable"; reason: string };

export function parseEduResetFragment(hash: string): EduResetLinkState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  if (accessToken) {
    const type = params.get("type");
    return {
      kind: "ready",
      accessToken,
      isInvite: type === "invite" || type === "signup",
    };
  }

  const errorDescription = params.get("error_description") ?? params.get("error");
  return {
    kind: "unusable",
    reason:
      errorDescription ??
      "This link is missing its sign-in token. Open the most recent email and use the link there.",
  };
}

export function validateEduNewPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (password.length < EDU_MIN_PASSWORD_LENGTH) {
    return `Choose a password of at least ${EDU_MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) return "Those two passwords do not match.";
  return null;
}
