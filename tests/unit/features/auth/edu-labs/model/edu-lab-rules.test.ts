import { hasMultipleEduLabs, labName } from "@/features/auth/edu-labs";

describe("EDU lab rules", () => {
  it("formats optional lab codes and detects a switchable list", () => {
    expect(labName({ id: "one", name: "North Campus", code: "NORTH" })).toBe(
      "North Campus · NORTH",
    );
    expect(labName({ id: "two", name: "South Campus" })).toBe("South Campus");
    expect(hasMultipleEduLabs([{ id: "one", name: "North Campus" }])).toBe(false);
    expect(hasMultipleEduLabs([
      { id: "one", name: "North Campus" },
      { id: "two", name: "South Campus" },
    ])).toBe(true);
  });
});
