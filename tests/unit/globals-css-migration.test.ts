import fs from "fs";
import path from "path";

describe("globals css migration", () => {
  const globalsPath = path.join(process.cwd(), "src/app/globals.css");
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
});
