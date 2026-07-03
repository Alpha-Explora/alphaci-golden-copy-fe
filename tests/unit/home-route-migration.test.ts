import fs from "fs";
import path from "path";

describe("home route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/home/page.tsx");
  const featurePath = path.join(process.cwd(), "src/features/dashboard/home/home-dashboard-page.tsx");
  const bentoPath = path.join(process.cwd(), "src/features/dashboard/home/home-bento-grid.tsx");

  it("keeps the app route as a thin entry point", () => {
    const routeSource = fs.readFileSync(routePath, "utf8");
    const routeLines = routeSource.trim().split(/\r?\n/);

    expect(routeLines).toHaveLength(3);
    expect(routeSource).toContain("@/features/dashboard/home/home-dashboard-page");
    expect(routeSource).not.toContain('"use client"');
  });

  it("keeps dashboard implementation in the feature module without mojibake", () => {
    const featureSource = fs.readFileSync(featurePath, "utf8");
    const bentoSource = fs.readFileSync(bentoPath, "utf8");

    expect(featureSource).toContain('"use client"');
    expect(featureSource).toContain("function HomeDashboardContent");
    expect(featureSource).not.toMatch(/[^\x00-\x7F]/);
    expect(bentoSource).toContain("export function BentoGrid");
    expect(bentoSource).not.toMatch(/[^\x00-\x7F]/);
  });
});
