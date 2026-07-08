import fs from "fs";
import path from "path";

describe("subscription congrats modal migration", () => {
  const componentPath = path.join(process.cwd(), "src/components/product/subscription-congrats-modal.tsx");
  const stylesPath = path.join(process.cwd(), "src/components/product/subscription-congrats-modal.styles.ts");
  const globalsPath = path.join(process.cwd(), "src/app/globals.css");

  it("keeps subscription modal checklist styles out of globals.css", () => {
    const componentSource = fs.readFileSync(componentPath, "utf8");
    const stylesSource = fs.readFileSync(stylesPath, "utf8");
    const globalsSource = fs.readFileSync(globalsPath, "utf8");

    expect(componentSource).toContain("subscription-congrats-modal.styles");
    expect(componentSource).not.toContain('className="subscription-checklist"');
    expect(componentSource).not.toContain('className="checklist-step"');
    expect(componentSource).not.toContain('className="hero-chip"');
    expect(stylesSource).toContain("checklist:");
    expect(stylesSource).toContain("checklistStep:");
    expect(stylesSource).toContain("badge:");

    for (const selector of [
      ".subscription-rail",
      ".status-pill-row",
      ".subscription-plan-grid",
      ".subscription-plan-card",
      ".subscription-checklist",
      ".checklist-step",
      ".feature-list",
    ]) {
      expect(globalsSource).not.toContain(selector);
    }
  });
});