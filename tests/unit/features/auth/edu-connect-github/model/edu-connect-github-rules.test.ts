import {
  canConnectEduGithub,
  githubConnectionCopy,
} from "@/features/auth/edu-connect-github";

describe("EDU GitHub linking rules", () => {
  it("allows staff roles and refuses students", () => {
    expect(canConnectEduGithub("STUDENT")).toBe(false);
    expect(canConnectEduGithub("TEACHER")).toBe(true);
    expect(canConnectEduGithub("ADMIN")).toBe(true);
    expect(canConnectEduGithub(null)).toBe(false);
  });

  it("changes the copy for reconnect versus first-time linking", () => {
    expect(githubConnectionCopy(false).title).toBe("Connect your GitHub account");
    expect(githubConnectionCopy(true).title).toBe("GitHub is connected");
  });
});
