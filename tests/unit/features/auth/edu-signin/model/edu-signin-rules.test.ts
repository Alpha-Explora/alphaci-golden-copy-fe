import {
  audienceLabel,
  validateEduSignIn,
  wrongDoorRoute,
} from "@/features/auth/edu-signin";

describe("EDU sign-in rules", () => {
  it("validates the shared credential form", () => {
    expect(validateEduSignIn("", "password")).toBe("Enter a valid email address.");
    expect(validateEduSignIn("student@school.edu", "")).toBe("Enter your password.");
    expect(validateEduSignIn("student@school.edu", "password")).toBeNull();
  });

  it("keeps the student and staff doors separate", () => {
    expect(wrongDoorRoute("STUDENT")).toBe("/signin/staff");
    expect(wrongDoorRoute("STAFF")).toBe("/signin");
    expect(audienceLabel("STUDENT")).toBe("student");
    expect(audienceLabel("STAFF")).toBe("staff");
  });
});
