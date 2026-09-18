import {
  parseEduResetFragment,
  validateEduNewPassword,
} from "@/features/auth/edu-password-recovery";

describe("EDU password recovery rules", () => {
  it("reads recovery and invitation tokens from the URL fragment", () => {
    expect(parseEduResetFragment("#access_token=abc&type=recovery")).toEqual({
      kind: "ready",
      accessToken: "abc",
      isInvite: false,
    });
    expect(parseEduResetFragment("#access_token=abc&type=invite")).toEqual({
      kind: "ready",
      accessToken: "abc",
      isInvite: true,
    });
    expect(parseEduResetFragment("#error=access_denied&error_description=Link+expired")).toEqual({
      kind: "unusable",
      reason: "Link expired",
    });
  });

  it("validates password confirmation before sending the token back", () => {
    expect(validateEduNewPassword("short", "short")).toContain("8 characters");
    expect(validateEduNewPassword("password", "different")).toBe("Those two passwords do not match.");
    expect(validateEduNewPassword("password", "password")).toBeNull();
  });
});
