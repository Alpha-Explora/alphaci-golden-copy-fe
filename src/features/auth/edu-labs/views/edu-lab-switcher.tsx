"use client";

import type { EduLab, EduSessionStatus } from "@/features/auth/edu-session";

import { labName } from "../model/edu-lab-rules";

export function EduLabSwitcher({
  labs,
  selectedLabId,
  status,
  onSelect,
}: Readonly<{
  labs: readonly EduLab[];
  selectedLabId: string | null;
  status: EduSessionStatus;
  onSelect: (labId: string) => void | Promise<void>;
}>) {
  if (labs.length === 0) return null;

  return (
    <label className="auth-self-serve-field" htmlFor="edu-active-lab">
      <span>Active lab</span>
      <select
        aria-label="Active lab"
        disabled={status === "loading" || status === "selecting"}
        id="edu-active-lab"
        onChange={(event) => void onSelect(event.target.value)}
        value={selectedLabId ?? ""}
      >
        {!selectedLabId ? <option value="">Choose a lab</option> : null}
        {labs.map((lab) => (
          <option key={lab.id} value={lab.id}>
            {labName(lab)}
          </option>
        ))}
      </select>
      <small>
        Lab access is checked by the server for every selection.
      </small>
    </label>
  );
}
