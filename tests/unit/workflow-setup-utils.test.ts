import {
  inferProjectKind,
  withTestSuffix,
} from "../../src/components/product/workflow-setup-utils";
import type { ProjectTypeOption } from "../../src/lib/api/contracts";

describe("workflow setup utilities", () => {
  it("uses the project type kind when present", () => {
    expect(inferProjectKind({ kind: "frontend" } as ProjectTypeOption)).toBe("frontend");
    expect(inferProjectKind({ kind: "backend" } as ProjectTypeOption)).toBe("backend");
  });

  it("infers frontend and backend kinds from project type text", () => {
    expect(inferProjectKind({ id: "nextjs", label: "Next.js app" } as ProjectTypeOption)).toBe("frontend");
    expect(inferProjectKind({ framework: "nestjs", runtime: "node" } as ProjectTypeOption)).toBe("backend");
  });

  it("adds test suffix without duplicating it", () => {
    expect(withTestSuffix("orders-api")).toBe("orders-api-test");
    expect(withTestSuffix("orders-api-test")).toBe("orders-api-test");
    expect(withTestSuffix("   ")).toBe("flowci-project-test");
  });
});
