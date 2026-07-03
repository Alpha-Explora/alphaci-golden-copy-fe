import fs from "fs";
import path from "path";

describe("workflow setup tab migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/workflow-setup-tab.tsx");
  const setupStateHookPath = path.join(process.cwd(), "src/components/product/use-workflow-setup-state.ts");
  const setupUtilsPath = path.join(process.cwd(), "src/components/product/workflow-setup-utils.ts");
  const githubPanelPath = path.join(process.cwd(), "src/components/product/workflow-setup-github-panel.tsx");

  it("keeps setup quota and action-state ownership in a dedicated hook", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");

    expect(fs.existsSync(setupStateHookPath)).toBe(true);
    expect(componentSource).toContain("useWorkflowSetupState");
    expect(componentSource).not.toContain("getMyUsage(");
    expect(componentSource).not.toContain("useState<UsageLimitItem[]>");
    expect(componentSource).not.toContain("useEffect(");
    expect(fs.existsSync(setupUtilsPath)).toBe(true);
    expect(componentSource).toContain("workflow-setup-utils");
    expect(componentSource).not.toContain("function inferProjectKind");
    expect(componentSource).not.toContain("function withTestSuffix");
    expect(fs.existsSync(githubPanelPath)).toBe(true);
    expect(componentSource).toContain("WorkflowSetupGithubPanel");
    expect(componentSource).not.toContain("installationStatusCopy");
    expect(componentSource).not.toContain("handleLinkInstallation");
  });

  it("keeps workflow setup files inside the next migration budget", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const hookSource = fs.existsSync(setupStateHookPath) ? fs.readFileSync(setupStateHookPath, "utf8") : "";
    const setupUtilsSource = fs.existsSync(setupUtilsPath) ? fs.readFileSync(setupUtilsPath, "utf8") : "";
    const githubPanelSource = fs.existsSync(githubPanelPath) ? fs.readFileSync(githubPanelPath, "utf8") : "";
    const mojibakePattern = /[\u00c2\u00e2]/;

    expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(820);
    expect(hookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(220);
    expect(setupUtilsSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(80);
    expect(githubPanelSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(180);
    expect(hookSource).not.toMatch(mojibakePattern);
    expect(setupUtilsSource).not.toMatch(mojibakePattern);
    expect(githubPanelSource).not.toMatch(mojibakePattern);
  });
});
