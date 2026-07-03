import fs from "fs";
import path from "path";

describe("deployment provisioning setup migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/deployment-provisioning-setup.tsx");
  const utilsPath = path.join(process.cwd(), "src/components/product/deployment-provisioning-utils.ts");

  it("keeps provisioning mutation helpers in a dedicated utility module", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");

    expect(fs.existsSync(utilsPath)).toBe(true);
    expect(componentSource).toContain('from "./deployment-provisioning-utils"');
    expect(componentSource).not.toContain("function updateVariableGroupAt(");
    expect(componentSource).not.toContain("function toggleGroupTargetBranch(");
    expect(componentSource).not.toContain("function withRenderDefaults(");
    expect(componentSource).not.toContain("function fallbackTarget(");
  });

  it("keeps deployment provisioning files inside the current migration budget", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const utilsSource = fs.existsSync(utilsPath) ? fs.readFileSync(utilsPath, "utf8") : "";
    const mojibakePattern = /[\u00c2\u00e2]/;

    expect(componentSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(720);
    expect(utilsSource.trim().split(/\r?\n/).length).toBeLessThanOrEqual(280);
    expect(utilsSource).not.toMatch(mojibakePattern);
  });
});
