export type EduAudience = "STUDENT" | "STAFF";

export type EduRole = "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";

export interface EduUser {
  id: string;
  email: string;
  name: string;
  role: EduRole;
  githubLogin: string | null;
}

export interface EduLab {
  id: string;
  name: string;
  code?: string;
}

export interface EduGithubStatus {
  linked: boolean;
  login: string | null;
}

/**
 * Stable wire contract for the EDU session endpoints.
 *
 * The response deliberately stays separate from the generic Golden Copy
 * AuthMeResponse: EDU role and lab state must not leak into SaaS or Enterprise
 * session consumers. A signed-in response always has a user; an anonymous
 * response uses null and empty lab state.
 */
export interface EduSessionResponse {
  authenticated: boolean;
  user: EduUser | null;
  labs: EduLab[];
  selectedLabId: string | null;
  github: EduGithubStatus;
  /** The backend may supply a role-aware post-login destination. */
  redirectTo?: string;
}

export type EduAuthenticatedSession = EduSessionResponse & {
  authenticated: true;
  user: EduUser;
};

export interface EduStudentSignupResponse {
  created: boolean;
  needsEmailConfirmation: boolean;
  message: string;
}

export interface EduPasswordResetResponse {
  ok: boolean;
  message: string;
}

export interface EduLabsResponse {
  labs: EduLab[];
  selectedLabId: string | null;
}

export type EduSessionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "signed-out"
  | "selecting"
  | "error";
