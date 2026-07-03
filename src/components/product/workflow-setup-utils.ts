import type { CSSProperties } from "react";
import type { ProjectTypeOption } from "@/lib/api/contracts";

export const setupLabelAccentStyle: CSSProperties = {
  borderLeft: "2px solid var(--brand)",
  paddingLeft: "0.5rem",
  color: "var(--text-secondary)",
  fontSize: "0.72rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export function inferProjectKind(
  selectedProjectType: Pick<ProjectTypeOption, "id" | "label" | "framework" | "runtime" | "kind"> | null | undefined,
): "frontend" | "backend" | undefined {
  if (selectedProjectType?.kind) {
    return selectedProjectType.kind;
  }

  const text = [
    selectedProjectType?.id,
    selectedProjectType?.label,
    selectedProjectType?.framework,
    selectedProjectType?.runtime,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(next|react|frontend|web|vue|svelte)/.test(text)) {
    return "frontend";
  }
  if (/(nest|node|api|backend|server)/.test(text)) {
    return "backend";
  }
  return undefined;
}

export function withTestSuffix(value: string) {
  const base = value.trim() || "flowci-project";
  return base.endsWith("-test") ? base : `${base}-test`;
}
