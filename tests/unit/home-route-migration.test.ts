import fs from "fs";
import path from "path";

describe("home route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/home/page.tsx");
  const featurePath = path.join(process.cwd(), "src/features/dashboard/home/home-dashboard-page.tsx");
  const bentoPath = path.join(process.cwd(), "src/features/dashboard/home/home-bento-grid.tsx");
  const componentPaths = [
    path.join(process.cwd(), "src/features/dashboard/home/home-dashboard-header.tsx"),
    path.join(process.cwd(), "src/features/dashboard/home/home-dashboard-tabs.tsx"),
    path.join(process.cwd(), "src/features/dashboard/home/home-overview-panel.tsx"),
    path.join(process.cwd(), "src/features/dashboard/home/home-activity-panel.tsx"),
    path.join(process.cwd(), "src/features/dashboard/home/home-repositories-panel.tsx"),
    path.join(process.cwd(), "src/components/layout/app-shell/dashboard-shell.tsx"),
  ];
  const stylePaths = [
    path.join(process.cwd(), "src/components/layout/app-shell/dashboard-shell.module.css"),
  ];

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
    expect(featureSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(500);
    expect(featureSource).toContain("HomeDashboardHeader");
    expect(featureSource).toContain("HomeDashboardTabs");
    expect(featureSource).not.toContain("dash-shell");
    expect(featureSource).not.toContain("dash-page-content");
    expect(featureSource).not.toMatch(/[^\x00-\x7F]/);
    expect(bentoSource).toContain("export function BentoGrid");
    expect(bentoSource).not.toMatch(/[^\x00-\x7F]/);
    for (const componentPath of componentPaths) {
      const componentSource = fs.readFileSync(componentPath, "utf8");
      expect(componentSource).not.toMatch(/[^\x00-\x7F]/);
      expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    }
    for (const stylePath of stylePaths) {
      const styleSource = fs.readFileSync(stylePath, "utf8");
      expect(styleSource).not.toMatch(/[^\x00-\x7F]/);
      expect(styleSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(400);
    }
  });
});
