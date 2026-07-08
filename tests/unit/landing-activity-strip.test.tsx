import fs from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ActivityStrip } from "../../src/features/public-site/landing/activity-strip";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

function classList(container: Element) {
  return Array.from(container.querySelectorAll("*"))
    .flatMap((element) => Array.from(element.classList));
}

describe("ActivityStrip migration", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders recent activity without legacy activity classes", () => {
    const result = render(<ActivityStrip />);
    root = result.root;

    expect(result.container.querySelector("[data-activity-strip='true']")).toBeInTheDocument();
    expect(result.container).toHaveTextContent("./activity/recent.log");
    expect(result.container).toHaveTextContent("live");
    expect(result.container.querySelectorAll("[data-activity-item]")).toHaveLength(4);
    expect(result.container).toHaveTextContent("payments-api");
    expect(result.container).toHaveTextContent("Production release approved");
    expect(classList(result.container).some((name) => name === "activity-section" || name === "activity-item" || name === "file-path-label")).toBe(false);
  });

  it("keeps activity selectors out of globals after migration", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const globals = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const sectionSource = fs.readFileSync(path.join(process.cwd(), "src/features/public-site/landing/activity-strip.tsx"), "utf8");

    expect(pageSource).toContain("ActivityStrip");
    expect(pageSource).not.toContain("function ActivityStrip");
    expect(sectionSource).not.toContain("activity-strip.module.css");
    expect(sectionSource).toContain("data-activity-strip");
    expect(sectionSource).toContain("[animation:flowPulse_1.5s_ease-in-out_infinite]");
    expect(globals).not.toContain(".activity-section");
    expect(globals).not.toContain(".activity-item");
  });
});
