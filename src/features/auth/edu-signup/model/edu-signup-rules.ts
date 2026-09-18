export const EDU_MIN_PASSWORD_LENGTH = 8;

export function validateEduSignup(email: string, password: string): string | null {
  if (!email.trim() || !email.includes("@")) {
    return "Enter your school email address.";
  }
  if (password.length < EDU_MIN_PASSWORD_LENGTH) {
    return `Choose a password of at least ${EDU_MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
