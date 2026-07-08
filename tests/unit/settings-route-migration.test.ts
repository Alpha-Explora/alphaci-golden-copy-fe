import fs from "fs";
import path from "path";

function collectFiles(directoryPath: string, extension: string): string[] {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(entryPath, extension);
    }
    return entry.isFile() && entry.name.endsWith(extension) ? [entryPath] : [];
  });
}

describe("settings route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/settings/page.tsx");
  const featureDir = path.join(process.cwd(), "src/features/dashboard/settings");
  const featurePath = path.join(featureDir, "settings-page.tsx");
  const accountSectionPath = path.join(featureDir, "settings-account-section.tsx");
  const billingSectionPath = path.join(featureDir, "settings-billing-section.tsx");
  const connectionsSectionPath = path.join(featureDir, "settings-connections-section.tsx");
  const guideSectionPath = path.join(featureDir, "settings-guide-section.tsx");
  const dangerSectionPath = path.join(featureDir, "settings-danger-section.tsx");
  const providerSettingsPath = path.join(process.cwd(), "src/components/settings/deployment-providers-section.tsx");
  const stylesPath = path.join(featureDir, "settings-page.styles.ts");

  it("keeps the app route as a thin entry point", () => {
    const routeSource = fs.readFileSync(routePath, "utf8");
    const routeLines = routeSource.trim().split(/\r?\n/);

    expect(routeLines).toHaveLength(3);
    expect(routeSource).toContain("@/features/dashboard/settings/settings-page");
    expect(routeSource).not.toContain('"use client"');
  });

  it("keeps settings implementation feature-owned and off legacy shell/button globals", () => {
    const featureSource = fs.readFileSync(featurePath, "utf8");

    expect(featureSource).toContain('"use client"');
    expect(featureSource).toContain("DashboardShell");
    expect(featureSource).toContain("DashboardPageContent");
    expect(featureSource).toContain("calc(var(--sidebar-width) + var(--layout-gutter))");
    expect(featureSource).toContain("calc(64px + 1rem)");
    expect(featureSource).not.toContain("dash-shell");
    expect(featureSource).not.toContain("dash-page-content");
    expect(featureSource).not.toContain("dash-action-btn");
    expect(featureSource).not.toContain("primary-button");
    expect(featureSource).not.toContain("ghost-button");

    for (const componentPath of collectFiles(featureDir, ".tsx")) {
      const source = fs.readFileSync(componentPath, "utf8");
      expect(source).not.toContain("dash-badge-violet");
      expect(source).not.toContain("error-text");
      expect(source).not.toContain("settings-nav-btn");
      expect(source).not.toContain("primary-button");
      expect(source).not.toContain("ghost-button");
    }
  });

  it("keeps migrated settings files ASCII-clean", () => {
    for (const componentPath of collectFiles(featureDir, ".tsx")) {
      const source = fs.readFileSync(componentPath, "utf8");
      expect(source).not.toMatch(/[^\x00-\x7F]/);
    }
  });

  it("keeps settings feature decomposed into budgeted local modules", () => {
    const billingSource = fs.readFileSync(billingSectionPath, "utf8");
    const connectionsSource = fs.readFileSync(connectionsSectionPath, "utf8");

    expect(fs.existsSync(stylesPath)).toBe(true);
    expect(fs.existsSync(accountSectionPath)).toBe(true);
    expect(fs.existsSync(billingSectionPath)).toBe(true);
    expect(fs.existsSync(connectionsSectionPath)).toBe(true);
    expect(fs.existsSync(guideSectionPath)).toBe(true);
    expect(fs.existsSync(dangerSectionPath)).toBe(true);

    for (const componentPath of collectFiles(featureDir, ".tsx")) {
      const source = fs.readFileSync(componentPath, "utf8");
      const lineCount = source.trim().split(/\r?\n/).length;
      const budget = componentPath.endsWith("settings-page.tsx") ? 525 : 350;

      expect(lineCount).toBeLessThanOrEqual(budget);
    }

    const styleSource = fs.readFileSync(stylesPath, "utf8");
    expect(styleSource).not.toMatch(/[^\x00-\x7F]/);
    expect(styleSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(400);
    expect(styleSource).not.toContain("data-theme=\"light\"");
    expect(styleSource).not.toContain("Light mode");
    expect(styleSource).not.toContain("settings-page.module.css");
    expect(fs.readFileSync(accountSectionPath, "utf8")).toContain("SettingsAccountSection");
    expect(billingSource).toContain("styles.sectionStack");
    expect(billingSource).toContain("styles.splitRow");
    expect(connectionsSource).toContain("styles.splitRow");
  });

  it("keeps provider settings off legacy global button classes", () => {
    const providerSource = fs.readFileSync(providerSettingsPath, "utf8");

    expect(providerSource).not.toContain("primary-button");
    expect(providerSource).not.toContain("ghost-button");
    expect(providerSource).not.toContain("error-text");
  });
});
