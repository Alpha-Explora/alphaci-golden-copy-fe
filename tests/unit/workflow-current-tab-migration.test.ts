import fs from "fs";
import path from "path";

describe("workflow current tab migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/workflow-current-tab.tsx");
  const overviewHookPath = path.join(process.cwd(), "src/components/product/use-workflow-project-overview.ts");
  const settingsHookPath = path.join(process.cwd(), "src/components/product/use-workflow-settings-preview.ts");
  const telemetryHookPath = path.join(process.cwd(), "src/components/product/use-workflow-project-telemetry.ts");
  const targetListPath = path.join(process.cwd(), "src/components/product/workflow-deployment-targets-list.tsx");
  const targetManagementHookPath = path.join(process.cwd(), "src/components/product/use-workflow-deployment-targets.ts");

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
    expect(fs.existsSync(targetListPath)).toBe(true);
    expect(componentSource).toContain("DeploymentTargetsList");
    expect(fs.existsSync(targetManagementHookPath)).toBe(true);
    expect(fs.readFileSync(targetListPath, "utf8")).toContain("useWorkflowDeploymentTargets");
    expect(componentSource).not.toContain("updateDeploymentTarget(");
    expect(componentSource).not.toContain("syncDeploymentTarget(");
    expect(componentSource).not.toContain("detachDeploymentTarget(");
  });

  it("keeps the first workflow-current extraction inside migration budgets", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const hookSource = fs.existsSync(overviewHookPath) ? fs.readFileSync(overviewHookPath, "utf8") : "";
    const settingsHookSource = fs.existsSync(settingsHookPath) ? fs.readFileSync(settingsHookPath, "utf8") : "";
    const telemetryHookSource = fs.existsSync(telemetryHookPath) ? fs.readFileSync(telemetryHookPath, "utf8") : "";
    const targetListSource = fs.existsSync(targetListPath) ? fs.readFileSync(targetListPath, "utf8") : "";
    const targetManagementHookSource = fs.existsSync(targetManagementHookPath) ? fs.readFileSync(targetManagementHookPath, "utf8") : "";
    const mojibakePattern = /[\u00c2\u00e2]/;

    expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(1550);
    expect(hookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(settingsHookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(telemetryHookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(350);
    expect(targetListSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(260);
    expect(targetManagementHookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(250);
    expect(hookSource).not.toMatch(mojibakePattern);
    expect(settingsHookSource).not.toMatch(mojibakePattern);
    expect(telemetryHookSource).not.toMatch(mojibakePattern);
    expect(targetListSource).not.toMatch(mojibakePattern);
    expect(targetManagementHookSource).not.toMatch(mojibakePattern);
  });
});
