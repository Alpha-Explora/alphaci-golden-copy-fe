import {
  EDU_MIN_PASSWORD_LENGTH,
  validateEduSignup,
} from "@/features/auth/edu-signup";

describe("EDU signup rules", () => {
  it("requires an email and the source minimum password length", () => {
    expect(EDU_MIN_PASSWORD_LENGTH).toBe(8);
    expect(validateEduSignup("", "password")).toBe("Enter your school email address.");
    expect(validateEduSignup("student@school.edu", "short")).toContain("8 characters");
    expect(validateEduSignup("student@school.edu", "password")).toBeNull();
  });
});
