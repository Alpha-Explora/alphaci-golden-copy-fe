import fs from "fs";
import path from "path";

function collectTsxFiles(directoryPath: string): string[] {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return collectTsxFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

describe("runs route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/runs/page.tsx");
  const runsFeatureDir = path.join(process.cwd(), "src/features/dashboard/runs");
  const featurePath = path.join(process.cwd(), "src/features/dashboard/runs/runs-page.tsx");
  const componentPaths = collectTsxFiles(runsFeatureDir);

  it("keeps the app route as a thin entry point", () => {
    const routeSource = fs.readFileSync(routePath, "utf8");
    const routeLines = routeSource.trim().split(/\r?\n/);

    expect(routeLines).toHaveLength(3);
    expect(routeSource).toContain("@/features/dashboard/runs/runs-page");
    expect(routeSource).not.toContain('"use client"');
  });

  it("keeps the runs implementation in the feature module without mojibake", () => {
    const featureSource = fs.readFileSync(featurePath, "utf8");

    expect(featureSource).toContain('"use client"');
    expect(featureSource).toContain("function RunsContent");
    expect(featureSource).toContain('router.replace("/signup")');
    expect(featureSource).toContain("Sign up to see your pipeline runs.");
    expect(featureSource).not.toContain("dash-shell");
    expect(featureSource).not.toContain("dash-page-content");
    expect(featureSource).not.toContain("primary-button");
    expect(featureSource).not.toContain("ghost-button");
    expect(featureSource).not.toContain("preview mode");
  });

  it("keeps migrated runs feature files under budget and ASCII-clean", () => {
    for (const componentPath of componentPaths) {
      const source = fs.readFileSync(componentPath, "utf8");
      expect(source.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
      expect(source).not.toMatch(/[^\x00-\x7F]/);
      expect(source).not.toContain("primary-button");
      expect(source).not.toContain("ghost-button");
    }
  });
});
