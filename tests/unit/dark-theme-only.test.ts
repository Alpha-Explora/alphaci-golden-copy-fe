import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");

function readRepoFile(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function hasLightThemeRuntimeBranch(source: string) {
  return /getAttribute\(["']data-theme["']\)\s*={2,3}\s*["']light["']/.test(source);
}

describe("dark-only theme architecture", () => {
  it("does not keep light-theme selector branches in source styles or UI code", () => {
    const checkedFiles = [
      "src/app/globals.css",
      "src/styles/base.css",
      "src/styles/tokens.css",
      "src/components/layout/flow-background.tsx",
      "src/features/public-site/auth/oauth-auth-page.tsx",
    ];

    for (const filePath of checkedFiles) {
      expect(readRepoFile(filePath)).not.toContain('data-theme="light"');
      expect(readRepoFile(filePath)).not.toContain("[data-theme=\"light\"]");
      expect(readRepoFile(filePath)).not.toContain("data-theme') === \"light\"");
      expect(hasLightThemeRuntimeBranch(readRepoFile(filePath))).toBe(false);
    }
  });

  it("recognizes the removed data-theme light runtime branch shape", () => {
    expect(hasLightThemeRuntimeBranch('document.documentElement.getAttribute("data-theme") === "light"')).toBe(true);
    expect(hasLightThemeRuntimeBranch("document.documentElement.getAttribute('data-theme') === 'light'")).toBe(true);
    expect(hasLightThemeRuntimeBranch('document.documentElement.getAttribute("data-theme") === "dark"')).toBe(false);
  });

  it("keeps the root layout dark without a client theme provider", () => {
    const layoutSource = readRepoFile("src/app/layout.tsx");

    expect(layoutSource).toContain('data-theme="dark"');
    expect(layoutSource).not.toContain("ThemeProvider");
    expect(fs.existsSync(path.join(repoRoot, "src/lib/theme-context.tsx"))).toBe(false);
  });

  it("does not keep dead light-mode background branches or mojibake comments", () => {
    const flowBackgroundSource = readRepoFile("src/components/layout/flow-background.tsx");

    expect(flowBackgroundSource).not.toContain("LightOrb");
    expect(flowBackgroundSource).not.toContain("isLight");
    expect(flowBackgroundSource).not.toContain("LIGHT_STATIC_GRADIENT");
    expect(flowBackgroundSource).not.toMatch(/[\u00e2\u00c3\u00c2\ufffd]/);
  });
});
