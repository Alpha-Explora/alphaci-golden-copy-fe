import fs from "fs";
import path from "path";

const globalsPath = path.join(process.cwd(), "src/app/globals.css");
const feedbackStylesPath = path.join(process.cwd(), "src/components/ui/feedback-styles.ts");
const migratedSourcePaths = [
  "src/components/product/workflow-builder.tsx",
  "src/components/product/workflow-history-panel.tsx",
  "src/components/product/workflow-projects-panel.tsx",
  "src/features/dashboard/home/home-activity-panel.tsx",
  "src/features/dashboard/home/home-repositories-panel.tsx",
  "src/features/dashboard/home/home-overview-panel.tsx",
  "src/features/dashboard/runs/runs-state-panels.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/feedback/page.tsx",
  "src/app/admin/gcp-runtime/page.tsx",
  "src/app/admin/users/[id]/page.tsx",
].map((sourcePath) => path.join(process.cwd(), sourcePath));

describe("feedback styles migration", () => {
  it("keeps shared feedback/loading selectors out of globals.css", () => {
    const globalsSource = fs.readFileSync(globalsPath, "utf8");

    for (const selector of [
      ".status-banner",
      ".skeleton-card",
      ".callback-spinner",
      ".callback-pulse-dot",
      ".error-inline",
      ".error-inline-icon",
      ".error-inline-msg",
      ".kpi-skeleton-value",
    ]) {
      expect(globalsSource).not.toContain(selector);
    }
  });

  it("uses the shared Tailwind style map at migrated call sites", () => {
    const feedbackStylesSource = fs.readFileSync(feedbackStylesPath, "utf8");
    expect(feedbackStylesSource).toContain("feedbackStyles");
    expect(feedbackStylesSource).toContain("statusBannerTone");
    expect(feedbackStylesSource).toContain("skeletonCard");
    expect(feedbackStylesSource).toContain("inlineError");

    for (const sourcePath of migratedSourcePaths) {
      const source = fs.readFileSync(sourcePath, "utf8");
      expect(source).toContain("@/components/ui/feedback-styles");
      expect(source).not.toContain('className="error-inline');
      expect(source).not.toContain('className="skeleton-card');
      expect(source).not.toContain('className="status-banner');
    }
  });
});
