import { getApiBaseUrl, request } from "@/shared/api/request";

import type {
  EduAudience,
  EduLab,
  EduLabsResponse,
  EduPasswordResetResponse,
  EduSessionResponse,
  EduUser,
  EduStudentSignupResponse,
} from "../model/edu-session-types";

const EDU_AUTH_PATH = "/auth/edu";

interface EduApiUser {
  id: string;
  fullName: string;
  email: string;
  role: EduUser["role"];
  githubLogin: string | null;
}

interface EduApiLab {
  id: string;
  name: string;
  githubOrgName: string;
}

interface EduApiSession {
  authenticated: boolean;
  user: EduApiUser | null;
  labs: EduApiLab[];
  selectedOrgId: string | null;
  github: {
    linked: boolean;
    login: string | null;
  };
  redirectTo?: string;
}

interface EduApiLabsResponse {
  labs: EduApiLab[];
  selectedOrgId: string | null;
}

function mapUser(user: EduApiUser | null): EduUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
    githubLogin: user.githubLogin,
  };
}

function mapLab(lab: EduApiLab): EduLab {
  return { id: lab.id, name: lab.name, code: lab.githubOrgName };
}

function mapSession(response: EduApiSession): EduSessionResponse {
  return {
    authenticated: response.authenticated,
    user: mapUser(response.user),
    labs: response.labs.map(mapLab),
    selectedLabId: response.selectedOrgId,
    github: response.github,
    ...(response.redirectTo ? { redirectTo: response.redirectTo } : {}),
  };
}

export function eduLogin(input: {
  email: string;
  password: string;
  audience: EduAudience;
}): Promise<EduSessionResponse> {
  return request<EduApiSession>(`${EDU_AUTH_PATH}/login`, {
    method: "POST",
    body: JSON.stringify(input),
  }).then(mapSession);
}

export function eduStudentSignup(input: {
  email: string;
  password: string;
}): Promise<EduStudentSignupResponse> {
  return request<EduStudentSignupResponse>(`${EDU_AUTH_PATH}/student/signup`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function eduRequestPasswordReset(email: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`${EDU_AUTH_PATH}/request-password-reset`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function eduCompletePasswordReset(
  accessToken: string,
  password: string,
): Promise<EduPasswordResetResponse> {
  return request<EduPasswordResetResponse>(`${EDU_AUTH_PATH}/complete-password-reset`, {
    method: "POST",
    body: JSON.stringify({ accessToken, password }),
  });
}

export function getEduSession(): Promise<EduSessionResponse> {
  return request<EduApiSession>(`${EDU_AUTH_PATH}/me`).then(mapSession);
}

export function getEduLabs(): Promise<EduLabsResponse> {
  return request<EduApiLabsResponse>(`${EDU_AUTH_PATH}/labs`).then((response) => ({
    labs: response.labs.map(mapLab),
    selectedLabId: response.selectedOrgId,
  }));
}

export function selectEduLab(labId: string): Promise<EduLabsResponse> {
  return request<EduApiLabsResponse>(`${EDU_AUTH_PATH}/select-lab`, {
    method: "POST",
    body: JSON.stringify({ orgId: labId }),
  }).then((response) => ({
    labs: response.labs.map(mapLab),
    selectedLabId: response.selectedOrgId,
  }));
}

export function logoutEdu(): Promise<void> {
  return request<void>(`${EDU_AUTH_PATH}/logout`, { method: "POST" });
}

export function createEduGithubLinkUrl(returnTo = "/connect-github"): string {
  return `${getApiBaseUrl()}${EDU_AUTH_PATH}/github/start?returnTo=${encodeURIComponent(returnTo)}`;
}
