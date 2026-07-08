"use client";
import { feedbackStyles } from "@/components/ui/feedback-styles";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import {
  getAdminGcpRuntimeProjects,
  type AdminGcpRuntimeProject,
  type AdminGcpRuntimeProjectsPage,
} from "@/lib/api/admin-gcp-runtime";

const STATUS_OPTIONS = [
  "",
  "pending",
  "provisioning",
  "ready",
  "degraded",
  "drifted",
  "blocked_by_access",
  "failed",
  "archived",
];

const PLACEMENT_OPTIONS = ["", "shared_project", "dedicated_customer_project"];

type RuntimeFilters = {
  status?: string;
  runtimePlacement?: string;
  owner?: string;
};

export default function AdminGcpRuntimePage() {
  const [data, setData] = useState<AdminGcpRuntimeProjectsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [runtimePlacement, setRuntimePlacement] = useState("");
  const [owner, setOwner] = useState("");

  const filters = useMemo(
    () => ({
      status: status || undefined,
      runtimePlacement: runtimePlacement || undefined,
      owner: owner.trim() || undefined,
    }),
    [owner, runtimePlacement, status],
  );

  const load = useCallback(
    async (overrideFilters?: RuntimeFilters) => {
      setLoading(true);
      setError(null);
      try {
        setData(await getAdminGcpRuntimeProjects(overrideFilters ?? filters));
      } catch {
        setError("Could not load GCP runtime readiness.");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void load({
      status: stringOrUndefined(formData.get("status")),
      runtimePlacement: stringOrUndefined(formData.get("runtimePlacement")),
      owner: stringOrUndefined(formData.get("owner")),
    });
  }

  const attentionCount = data?.items.filter((item) => item.needsAttention).length ?? 0;

  return (
    <section aria-label="GCP runtime readiness" style={{ display: "grid", gap: "1rem" }}>
      <div style={topRowStyle}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>GCP Runtime</h1>
          <p style={mutedStyle}>
            {data ? `${data.total} targets, ${attentionCount} need attention` : "Runtime readiness"}
          </p>
        </div>
        <span className="status-chip status-chip-amber">
          Live GCP mutation is still access-gated
        </span>
      </div>

      <form onSubmit={onSubmit} style={filterRowStyle}>
        <label style={filterLabelStyle}>
          <span>Status</span>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} style={controlStyle}>
            {STATUS_OPTIONS.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "all"}
              </option>
            ))}
          </select>
        </label>
        <label style={filterLabelStyle}>
          <span>Placement</span>
          <select
            name="runtimePlacement"
            value={runtimePlacement}
            onChange={(e) => setRuntimePlacement(e.target.value)}
            style={controlStyle}
          >
            {PLACEMENT_OPTIONS.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "all"}
              </option>
            ))}
          </select>
        </label>
        <label style={filterLabelStyle}>
          <span>Owner or repo</span>
          <input
            name="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="login, repo, workspace"
            style={controlStyle}
          />
        </label>
        <button type="submit" className="primary-button" style={{ alignSelf: "end", padding: "0.5rem 1rem" }}>
          Filter
        </button>
      </form>

      {loading ? (
        <p style={mutedStyle}>Loading runtime targets...</p>
      ) : error ? (
        <div className={cn("glass-panel", feedbackStyles.inlineError, feedbackStyles.inlineErrorGlass)} role="alert">
          <span className={feedbackStyles.inlineErrorIcon} aria-hidden="true">!</span>
          <p className={feedbackStyles.inlineErrorMessage}>{error}</p>
          <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={() => void load()}>Retry</Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <p style={mutedStyle}>No GCP runtime targets match these filters.</p>
      ) : (
        <div className="glass-panel" style={{ overflowX: "auto", borderRadius: "0.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={cellStyle}>Project</th>
                <th style={cellStyle}>Runtime</th>
                <th style={cellStyle}>Reconcile</th>
                <th style={cellStyle}>Job</th>
                <th style={cellStyle}>Domain</th>
                <th style={cellStyle}>Previews</th>
                <th style={cellStyle}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <RuntimeRow key={`${item.project.id}:${item.runtime.environment}:${item.runtime.serviceSlot}`} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RuntimeRow({ item }: { item: AdminGcpRuntimeProject }) {
  return (
    <tr style={{ borderTop: "1px solid var(--border-soft)" }}>
      <td style={cellStyle}>
        <strong>{item.project.repository}</strong>
        <SmallLine>{item.workspace.name ?? item.workspace.id}</SmallLine>
        <SmallLine>{item.project.ownerLogin ?? "owner unknown"}</SmallLine>
      </td>
      <td style={cellStyle}>
        <span className={`status-chip ${item.needsAttention ? "status-chip-amber" : "status-chip-success"}`}>
          {item.runtime.deploymentStatus}
        </span>
        <SmallLine>{item.runtime.placement}</SmallLine>
        <SmallLine>{item.runtime.environment} / {item.runtime.serviceSlot}</SmallLine>
        <SmallLine>{item.runtime.cloudRunServiceName}</SmallLine>
      </td>
      <td style={cellStyle}>
        <strong>{item.reconciliation.status ?? "not checked"}</strong>
        <SmallLine>{item.reconciliation.errorCode ?? "no error"}</SmallLine>
        <SmallLine>{formatDate(item.reconciliation.checkedAt)}</SmallLine>
      </td>
      <td style={cellStyle}>
        <strong>{item.lastProvisioningJob.status ?? "no job"}</strong>
        <SmallLine>{item.lastProvisioningJob.type ?? "none"}</SmallLine>
        <SmallLine>{item.lastProvisioningJob.errorCode ?? "no error"}</SmallLine>
      </td>
      <td style={cellStyle}>
        <strong>{item.domain.hostname ?? "no domain"}</strong>
        <SmallLine>{item.domain.kind ?? "none"}</SmallLine>
        <SmallLine>{item.domain.certificateStatus ?? "not started"}</SmallLine>
      </td>
      <td style={cellStyle}>
        <strong>{item.previewCount}</strong>
        <SmallLine>{item.blockedEntitlementReason ?? "entitlements clear"}</SmallLine>
      </td>
      <td style={cellStyle}>
        <strong>{item.lastAuditEvent.code ?? "no event"}</strong>
        <SmallLine>{item.lastAuditEvent.message ?? "none"}</SmallLine>
        <SmallLine>{formatDate(item.lastAuditEvent.createdAt)}</SmallLine>
      </td>
    </tr>
  );
}

function SmallLine({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "var(--text-muted)", fontSize: "0.74rem", marginTop: "0.2rem" }}>{children}</div>;
}

function stringOrUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

function formatDate(value: string | null): string {
  if (!value) return "never";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const mutedStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: "0.85rem",
  margin: "0.25rem 0 0",
};

const topRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const filterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto",
  gap: "0.75rem",
  alignItems: "end",
};

const filterLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  color: "var(--text-secondary)",
  fontSize: "0.78rem",
};

const controlStyle: React.CSSProperties = {
  padding: "0.48rem 0.65rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--border-soft)",
  background: "var(--bg-elevated, rgba(15,23,42,0.4))",
  color: "inherit",
  minWidth: 0,
};

const cellStyle: React.CSSProperties = {
  padding: "0.65rem 0.85rem",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};
