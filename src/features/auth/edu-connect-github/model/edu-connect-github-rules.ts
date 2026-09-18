import type { EduRole } from "@/features/auth/edu-session";

export function canConnectEduGithub(role: EduRole | null): boolean {
  return role !== null && role !== "STUDENT";
}

export function githubConnectionCopy(linked: boolean): {
  title: string;
  description: string;
} {
  return linked
    ? {
        title: "GitHub is connected",
        description: "Reconnect if your staff team membership has changed.",
      }
    : {
        title: "Connect your GitHub account",
        description: "Linking GitHub lets the EDU service confirm your staff access.",
      };
}
