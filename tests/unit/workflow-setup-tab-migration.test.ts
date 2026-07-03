import fs from "fs";
import path from "path";

describe("workflow setup tab migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/workflow-setup-tab.tsx");
  const setupStateHookPath = path.join(process.cwd(), "src/components/product/use-workflow-setup-state.ts");

  it("keeps setup quota and action-state ownership in a dedicated hook", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");

    expect(fs.existsSync(setupStateHookPath)).toBe(true);
    expect(componentSource).toContain("useWorkflowSetupState");
    expect(componentSource).not.toContain("getMyUsage(");
    expect(componentSource).not.toContain("useState<UsageLimitItem[]>");
    expect(componentSource).not.toContain("useEffect(");
  });

  it("keeps workflow setup files inside the next migration budget", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const hookSource = fs.existsSync(setupStateHookPath) ? fs.readFileSync(setupStateHookPath, "utf8") : "";
    const mojibakePattern = /[\u00c2\u00e2]/;

    expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(930);
    expect(hookSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(220);
    expect(hookSource).not.toMatch(mojibakePattern);
  });
});
