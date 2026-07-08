import fs from "fs";
import path from "path";

describe("globals css migration", () => {
  const globalsPath = path.join(process.cwd(), "src/app/globals.css");
  const authPath = path.join(process.cwd(), "src/styles/auth.css");
  const productWorkflowsPath = path.join(process.cwd(), "src/styles/product-workflows.css");
  const providerSettingsPath = path.join(process.cwd(), "src/styles/provider-settings.css");
  const publicSitePath = path.join(process.cwd(), "src/styles/public-site.css");

  it("moves public site selector families out of globals css", () => {
    const globalsSource = fs.readFileSync(globalsPath, "utf8");
    const publicSiteSource = fs.existsSync(publicSitePath)
      ? fs.readFileSync(publicSitePath, "utf8")
      : "";

    expect(fs.existsSync(publicSitePath)).toBe(true);
    expect(globalsSource).toContain('@import "../styles/public-site.css";');
    expect(globalsSource).not.toContain(".public-guide-workflow");
    expect(globalsSource).not.toContain(".public-guide-step");
    expect(globalsSource).not.toContain(".public-site-cta");
    expect(publicSiteSource).toContain(".public-guide-workflow");
    expect(publicSiteSource).toContain(".public-guide-step");
    expect(publicSiteSource).toContain(".public-site-cta");
    expect(globalsSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(4650);
  });

  it("moves auth selector families out of globals css", () => {
    const globalsSource = fs.readFileSync(globalsPath, "utf8");
    const authSource = fs.existsSync(authPath)
      ? fs.readFileSync(authPath, "utf8")
      : "";

    expect(fs.existsSync(authPath)).toBe(true);
    expect(globalsSource).toContain('@import "../styles/auth.css";');
    expect(globalsSource).not.toContain(".auth-card-modern");
    expect(globalsSource).not.toContain(".auth-provider-button");
    expect(globalsSource).not.toContain(".auth-shell-split");
    expect(authSource).toContain(".auth-card-modern");
    expect(authSource).toContain(".auth-provider-button");
    expect(authSource).toContain(".auth-shell-split");
    expect(globalsSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(3550);
  });

  it("moves product workflow and provider settings selector families out of globals css", () => {
    const globalsSource = fs.readFileSync(globalsPath, "utf8");
    const productWorkflowsSource = fs.existsSync(productWorkflowsPath)
      ? fs.readFileSync(productWorkflowsPath, "utf8")
      : "";
    const providerSettingsSource = fs.existsSync(providerSettingsPath)
      ? fs.readFileSync(providerSettingsPath, "utf8")
      : "";
    const publicSiteSource = fs.existsSync(publicSitePath)
      ? fs.readFileSync(publicSitePath, "utf8")
      : "";

    expect(fs.existsSync(productWorkflowsPath)).toBe(true);
    expect(fs.existsSync(providerSettingsPath)).toBe(true);
    expect(globalsSource).toContain('@import "../styles/product-workflows.css";');
    expect(globalsSource).toContain('@import "../styles/provider-settings.css";');
    expect(globalsSource).not.toContain(".deployment-provisioning-setup");
    expect(globalsSource).not.toContain(".project-workspace");
    expect(globalsSource).not.toContain(".repo-grid");
    expect(globalsSource).not.toContain(".state-body");
    expect(globalsSource).not.toContain(".state-card");
    expect(globalsSource).not.toContain(".provider-settings-panel");
    expect(productWorkflowsSource).toContain(".deployment-provisioning-setup");
    expect(productWorkflowsSource).toContain(".project-workspace");
    expect(productWorkflowsSource).toContain(".repo-grid");
    expect(publicSiteSource).toContain(".state-body");
    expect(publicSiteSource).toContain(".state-card");
    expect(providerSettingsSource).toContain(".provider-settings-panel");
    expect(providerSettingsSource).toContain(".provider-connections-table");
    expect(globalsSource).not.toContain(".cta-gradient-button");
    expect(globalsSource).not.toContain(".cta-shimmer");
    expect(globalsSource).not.toContain(".marketing-nav-enhanced");
    expect(globalsSource).not.toContain(".brand-mark-enhanced");
    expect(globalsSource).not.toContain(".app-nav-premium");
    expect(globalsSource).not.toContain(".hero-mesh-bg");
    expect(globalsSource).not.toContain(".hero-br-desktop");
    expect(globalsSource).not.toContain(".stats-row-enhanced");
    expect(globalsSource).not.toContain(".stat-block-enhanced");
    expect(globalsSource).not.toContain("@keyframes orb-drift-3");
    for (const selector of [
      ".hero-chip",
      ".hero-highlight",
      ".hero-description",
      ".pill-row",
      ".status-passing",
      ".section-header",
      ".value-grid",
      ".kpi-grid",
      ".action-grid",
      ".value-card",
      ".kpi-card",
      ".action-tile",
      ".landing-features",
      ".value-card-icon",
      "@keyframes pipelinePulse",
      "@keyframes pipelineFlow",
      "@keyframes pipelineDash",
      "@keyframes gradientShift",
    ]) {
      expect(globalsSource).not.toContain(selector);
    }
    expect(globalsSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(1900);
  });
});
