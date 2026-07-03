import fs from "fs";
import path from "path";

describe("workflow current tab migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/workflow-current-tab.tsx");
  const overviewHookPath = path.join(process.cwd(), "src/components/product/use-workflow-project-overview.ts");
  const settingsHookPath = path.join(process.cwd(), "src/components/product/use-workflow-settings-preview.ts");
  const telemetryHookPath = path.join(process.cwd(), "src/components/product/use-workflow-project-telemetry.ts");

  it("keeps project overview state owned by a dedicated hook", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");

    expect(fs.existsSync(overviewHookPath)).toBe(true);
    expect(componentSource).toContain("useWorkflowProjectOverview");
    expect(componentSource).not.toContain("getProjectOverview(");
    expect(componentSource).not.toContain("syncProjectSnapshot(");
    expect(fs.existsSync(settingsHookPath)).toBe(true);
    expect(componentSource).toContain("useWorkflowSettingsPreview");
    expect(componentSource).not.toContain("getWorkflowSettings(");
    expect(componentSource).not.toContain("previewWorkflowSettings(");
    expect(componentSource).not.toContain("createWorkflowUpdatePullRequest(");
    expect(fs.existsSync(telemetryHookPath)).toBe(true);
    expect(componentSource).toContain("useWorkflowProjectTelemetry");
    expect(componentSource).not.toContain("getProjectCiRuns(");
    expect(componentSource).not.toContain("getProjectDeployments(");
    expect(componentSource).not.toContain("getProjectAuditEvents(");
    expect(componentSource).not.toContain("getProjectDrift(");
    expect(componentSource).not.toContain("runProjectDriftDetection(");
    expect(componentSource).not.toContain("repairProjectDriftFinding(");
  });

  it("keeps the first workflow-current extraction inside migration budgets", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const hookSource = fs.existsSync(overviewHookPath) ? fs.readFileSync(overviewHookPath, "utf8") : "";
    const settingsHookSource = fs.existsSync(settingsHookPath) ? fs.readFileSync(settingsHookPath, "utf8") : "";
    const telemetryHookSource = fs.existsSync(telemetryHookPath) ? fs.readFileSync(telemetryHookPath, "utf8") : "";

    expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(1750);
    expect(hookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(settingsHookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(telemetryHookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(hookSource).not.toMatch(/[^\x00-\x7F]/);
    expect(settingsHookSource).not.toMatch(/[^\x00-\x7F]/);
    expect(telemetryHookSource).not.toMatch(/[^\x00-\x7F]/);
  });
});
