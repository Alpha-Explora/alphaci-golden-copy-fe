import fs from "fs";
import path from "path";

describe("home route migration", () => {
  const routePath = path.join(process.cwd(), "src/app/home/page.tsx");
  const homeFeatureDir = path.join(process.cwd(), "src/features/dashboard/home");
  const featurePath = path.join(process.cwd(), "src/features/dashboard/home/home-dashboard-page.tsx");
  const bentoPath = path.join(process.cwd(), "src/features/dashboard/home/home-bento-grid.tsx");
  const globalsPath = path.join(process.cwd(), "src/app/globals.css");
  const filePathLabelPath = path.join(process.cwd(), "src/components/ui/file-path-label.tsx");
  const homeFeaturePaths = fs
    .readdirSync(homeFeatureDir)
    .filter((fileName) => fileName.endsWith(".tsx"))
    .map((fileName) => path.join(homeFeatureDir, fileName));
  const sharedComponentPaths = [
    path.join(process.cwd(), "src/components/layout/app-shell/dashboard-shell.tsx"),
  ];
  const stylePaths = [
    path.join(process.cwd(), "src/features/dashboard/home/home-bento-grid.styles.ts"),
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
    const globalsSource = fs.readFileSync(globalsPath, "utf8");
    const filePathLabelSource = fs.readFileSync(filePathLabelPath, "utf8");

    expect(featureSource).toContain('"use client"');
    expect(featureSource).toContain("function HomeDashboardContent");
    expect(featureSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(500);
    expect(featureSource).toContain("HomeDashboardHeader");
    expect(featureSource).toContain("HomeDashboardTabs");
    expect(featureSource).not.toContain("dash-shell");
    expect(featureSource).not.toContain("dash-page-content");
    expect(featureSource).not.toContain("primary-button");
    expect(featureSource).not.toContain("ghost-button");
    expect(featureSource).not.toMatch(/[^\x00-\x7F]/);
    expect(bentoSource).toContain("export function BentoGrid");
    expect(bentoSource).toContain("home-bento-grid.styles");
    expect(bentoSource).not.toContain("kpi-bento-grid");
    expect(bentoSource).not.toContain("bento-card");
    expect(bentoSource).not.toMatch(/className=["\'{][^"\'}]*file-path-label/);
    expect(filePathLabelSource).toContain("FilePathLabel");
    expect(globalsSource).not.toContain(".file-path-label");
    expect(globalsSource).not.toContain(".feature-card-dark");
    expect(globalsSource).not.toMatch(/^\\.stat-block[\\s.{:]/m);
    expect(globalsSource).not.toMatch(/^\\.stats-row[\\s.{:]/m);
    expect(globalsSource).not.toContain(".section-divider");
    expect(globalsSource).not.toContain(".repo-list");
    expect(globalsSource).not.toContain(".welcome-editorial");
    expect(globalsSource).not.toContain(".repo-full-list");
    expect(globalsSource).not.toContain(".user-avatar");
    expect(globalsSource).not.toContain(".user-avatar-placeholder");
    expect(globalsSource).not.toContain(".welcome-header");
    expect(globalsSource).not.toContain(".pipeline-track");
    expect(globalsSource).not.toContain(".pipeline-dot");
    expect(globalsSource).not.toContain(".pipeline-connector");
    expect(bentoSource).not.toContain('className="pipeline-track"');
    expect(bentoSource).not.toContain('className="pipeline-connector"');
    expect(bentoSource).not.toContain("pipeline-dot");
    expect(bentoSource).not.toMatch(/[^\x00-\x7F]/);
    for (const componentPath of homeFeaturePaths) {
      const componentSource = fs.readFileSync(componentPath, "utf8");
      expect(componentSource).not.toMatch(/[^\x00-\x7F]/);
      const lineBudget = componentPath.endsWith("home-dashboard-page.tsx") ? 500 : 350;
      expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(lineBudget);
      expect(componentSource).not.toContain("primary-button");
      expect(componentSource).not.toContain("ghost-button");
      expect(componentSource).not.toMatch(/className=["\'{][^"\'}]*file-path-label/);
      if (componentPath.endsWith("home-activity-panel.tsx")) {
        expect(componentSource).not.toContain("status-chip");
      }
      if (componentPath.endsWith("home-dashboard-header.tsx")) {
        expect(componentSource).not.toContain("dash-badge");
        expect(componentSource).not.toContain("welcome-editorial-avatar");
      }
    }
    for (const sharedComponentPath of sharedComponentPaths) {
      const sharedSource = fs.readFileSync(sharedComponentPath, "utf8");
      expect(sharedSource).not.toMatch(/[^\x00-\x7F]/);
      expect(sharedSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    }
    for (const stylePath of stylePaths) {
      const styleSource = fs.readFileSync(stylePath, "utf8");
      expect(styleSource).not.toMatch(/[^\x00-\x7F]/);
      expect(styleSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(400);
    }
  });
});
