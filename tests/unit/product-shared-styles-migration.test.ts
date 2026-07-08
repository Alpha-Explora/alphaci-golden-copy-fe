import fs from "fs";
import path from "path";

const globalsPath = path.join(process.cwd(), "src/app/globals.css");
const productWorkflowsCssPath = path.join(process.cwd(), "src/styles/product-workflows.css");
const productSharedStylesPath = path.join(process.cwd(), "src/components/product/product-shared-styles.ts");
const migratedSourcePaths = [
  "src/app/workflows/page.tsx",
  "src/features/dashboard/runs/runs-page.tsx",
  "src/features/dashboard/home/home-dashboard-page.tsx",
  "src/components/product/workflow-setup-tab.tsx",
  "src/components/product/setup-result-panel.tsx",
  "src/components/product/workflow-current-result-banner.tsx",
  "src/components/product/workflow-project-workflow-panel.tsx",
].map((sourcePath) => path.join(process.cwd(), sourcePath));

describe("product shared styles migration", () => {
  it("keeps branch chips and guest banners out of globals.css", () => {
    const globalsSource = fs.readFileSync(globalsPath, "utf8");
    const productCssSource = fs.readFileSync(productWorkflowsCssPath, "utf8");

    for (const selector of [
      ".hero-full",
      ".hero-full-content",
      ".branch-chip",
      ".guest-banner",
      ".guest-banner-text",
      ".guest-banner-actions",
      ".guest-locked",
      ".guest-lock-overlay",
      ".guest-lock-badge",
    ]) {
      expect(globalsSource).not.toContain(selector);
    }
    expect(productCssSource).not.toContain(".branch-chip--mono");
  });

  it("uses the shared Tailwind style map at migrated call sites", () => {
    const sharedStylesSource = fs.readFileSync(productSharedStylesPath, "utf8");
    expect(sharedStylesSource).toContain("productSharedStyles");
    expect(sharedStylesSource).toContain("branchChip");
    expect(sharedStylesSource).toContain("guestBanner");

    for (const sourcePath of migratedSourcePaths) {
      const source = fs.readFileSync(sourcePath, "utf8");
      expect(source).toContain("@/components/product/product-shared-styles");
      expect(source).not.toContain('className="branch-chip');
      expect(source).not.toContain('className="guest-banner');
    }
  });
});