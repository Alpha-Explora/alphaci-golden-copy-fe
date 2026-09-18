import {
  eduAuthErrorMessage,
  errorCode,
  errorMessage,
  errorStatus,
  isAuthenticatedEduSession,
  safeEduRedirect,
} from "@/features/auth/edu-session";

describe("EDU session rules", () => {
  it("accepts only same-origin relative redirects", () => {
    expect(safeEduRedirect("/home")).toBe("/home");
    expect(safeEduRedirect("//attacker.example", "/signin")).toBe("/signin");
    expect(safeEduRedirect("https://attacker.example", "/signin")).toBe("/signin");
    expect(safeEduRedirect(null)).toBe("/home");
  });

  it("recognizes an authenticated EDU response", () => {
    expect(
      isAuthenticatedEduSession({
        authenticated: true,
        user: {
          id: "user-1",
          email: "student@school.edu",
          name: "Student",
          role: "STUDENT",
          githubLogin: null,
        },
        labs: [],
        selectedLabId: null,
        github: { linked: false, login: null },
      }),
    ).toBe(true);
    expect(
      isAuthenticatedEduSession({
        authenticated: false,
        user: null,
        labs: [],
        selectedLabId: null,
        github: { linked: false, login: null },
      }),
    ).toBe(false);
  });

  it("reads stable status, code, and message fields from API errors", () => {
    const error = {
      status: 403,
      details: { code: "WRONG_SIGN_IN_DOOR", message: "Use staff sign in." },
    };
    expect(errorStatus(error)).toBe(403);
    expect(errorCode(error)).toBe("WRONG_SIGN_IN_DOOR");
    expect(errorMessage(error)).toBe("Use staff sign in.");
    expect(eduAuthErrorMessage({ status: 429 })).toContain("Too many attempts");
  });
});
