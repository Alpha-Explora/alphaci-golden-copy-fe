import { getApiBaseUrl, request } from "@/shared/api/request";

import {
  createEduGithubLinkUrl,
  eduCompletePasswordReset,
  eduLogin,
  eduRequestPasswordReset,
  eduStudentSignup,
  getEduLabs,
  getEduSession,
  logoutEdu,
  selectEduLab,
} from "@/features/auth/edu-session";

jest.mock("@/shared/api/request", () => ({
  getApiBaseUrl: jest.fn(),
  request: jest.fn(),
}));

const mockedRequest = request as jest.MockedFunction<typeof request>;
const mockedGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;

describe("EDU auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetApiBaseUrl.mockReturnValue("https://api.example.test/api/v1");
  });

  it("posts student/staff login to the EDU contract without a browser token", async () => {
    mockedRequest.mockResolvedValue({
      authenticated: true,
      user: {
        id: "user-1",
        fullName: "Teacher User",
        email: "teacher@school.edu",
        role: "TEACHER",
        githubLogin: null,
      },
      labs: [],
      selectedOrgId: null,
      github: { linked: false, login: null },
    } as never);

    await expect(
      eduLogin({ email: "teacher@school.edu", password: "secret", audience: "STAFF" }),
    ).resolves.toMatchObject({
      authenticated: true,
      user: { name: "Teacher User", role: "TEACHER" },
    });

    expect(mockedRequest).toHaveBeenCalledWith("/auth/edu/login", {
      method: "POST",
      body: JSON.stringify({ email: "teacher@school.edu", password: "secret", audience: "STAFF" }),
    });
  });

  it("keeps every EDU endpoint under the /auth/edu namespace", async () => {
    mockedRequest
      .mockResolvedValueOnce({ created: true, needsEmailConfirmation: true, message: "sent" } as never)
      .mockResolvedValueOnce({ ok: true } as never)
      .mockResolvedValueOnce({ ok: true, message: "saved" } as never)
      .mockResolvedValueOnce({
        authenticated: true,
        user: null,
        labs: [],
        selectedOrgId: null,
        github: { linked: false, login: null },
      } as never)
      .mockResolvedValueOnce({ labs: [], selectedOrgId: null } as never)
      .mockResolvedValueOnce({ labs: [], selectedOrgId: "lab-1" } as never)
      .mockResolvedValueOnce(undefined as never);

    await eduStudentSignup({ email: "student@school.edu", password: "password" });
    await eduRequestPasswordReset("student@school.edu");
    await eduCompletePasswordReset("fragment-token", "new-password");
    await getEduSession();
    await getEduLabs();
    await selectEduLab("lab-1");
    await logoutEdu();

    expect(mockedRequest.mock.calls.map(([path]) => path)).toEqual([
      "/auth/edu/student/signup",
      "/auth/edu/request-password-reset",
      "/auth/edu/complete-password-reset",
      "/auth/edu/me",
      "/auth/edu/labs",
      "/auth/edu/select-lab",
      "/auth/edu/logout",
    ]);
    expect(mockedRequest.mock.calls[5]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ orgId: "lab-1" }),
    });
  });

  it("creates an EDU GitHub link URL without storing provider state in the browser", () => {
    expect(createEduGithubLinkUrl("/connect-github")).toBe(
      "https://api.example.test/api/v1/auth/edu/github/start?returnTo=%2Fconnect-github",
    );
  });
});
