import type { EduLab } from "@/features/auth/edu-session";

export function labName(lab: EduLab): string {
  return lab.code ? `${lab.name} · ${lab.code}` : lab.name;
}

export function hasMultipleEduLabs(labs: readonly EduLab[]): boolean {
  return labs.length > 1;
}
