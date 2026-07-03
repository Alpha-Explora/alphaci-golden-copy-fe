import fs from "fs";
import path from "path";

function collectFiles(directoryPath: string, extension: string): string[] {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(entryPath, extension);
    }
    return entry.isFile() && entry.name.endsWith(extension) ? [entryPath] : [];
  });
}

describe("subscribe route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/subscribe/page.tsx");
  const featureDir = path.join(process.cwd(), "src/features/dashboard/subscribe");
  const featurePath = path.join(featureDir, "subscribe-page.tsx");
  const stylePath = path.join(featureDir, "subscribe-page.module.css");

  it("keeps the app route as a thin entry point", () => {
    const routeSource = fs.readFileSync(routePath, "utf8");
    const routeLines = routeSource.trim().split(/\r?\n/);

    expect(routeLines).toHaveLength(3);
    expect(routeSource).toContain("@/features/dashboard/subscribe/subscribe-page");
    expect(routeSource).not.toContain('"use client"');
  });

  it("keeps subscribe implementation feature-owned and off legacy shell globals", () => {
    const featureSource = fs.readFileSync(featurePath, "utf8");

    expect(featureSource).toContain('"use client"');
    expect(featureSource).toContain("DashboardShell");
    expect(featureSource).toContain("DashboardPageContent");
    expect(featureSource).not.toContain("dash-shell");
    expect(featureSource).not.toContain("dash-page-content");
    expect(featureSource).not.toContain("subscribe.module.css");
  });

  it("keeps migrated subscribe files under budget and ASCII-clean", () => {
    for (const componentPath of collectFiles(featureDir, ".tsx")) {
      const source = fs.readFileSync(componentPath, "utf8");
      expect(source.trim().split(/\r?\n/).length).toBeLessThanOrEqual(500);
      expect(source).not.toMatch(/[^\x00-\x7F]/);
    }

    const styleSource = fs.readFileSync(stylePath, "utf8");
    expect(styleSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(400);
    expect(styleSource).not.toMatch(/[^\x00-\x7F]/);
    expect(styleSource).not.toContain("data-theme=\"light\"");
    expect(styleSource).not.toContain("Light mode");
  });
});
