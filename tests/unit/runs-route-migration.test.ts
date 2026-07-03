import fs from "fs";
import path from "path";

describe("runs route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/runs/page.tsx");
  const featurePath = path.join(process.cwd(), "src/features/dashboard/runs/runs-page.tsx");

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
    expect(featureSource).not.toContain("preview mode");
    expect(featureSource).not.toMatch(/[^\x00-\x7F]/);
  });
});
