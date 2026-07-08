"use client";
import { feedbackStyles } from "@/components/ui/feedback-styles";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

import { getAdminUsers, type AdminUsersPage } from "@/lib/api/client";

export default function AdminUsersPageRoute() {
  const [data, setData] = useState<AdminUsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await getAdminUsers({ search: term || undefined, limit: 50 });
      setData(page);
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void load(search.trim());
  }

  return (
    <section aria-label="All users">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>Users</h1>
          {data && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              {data.total} total
            </p>
          )}
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search login, name, email…"
            aria-label="Search users"
            style={{ padding: "0.45rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-soft)", background: "var(--bg-elevated, rgba(15,23,42,0.4))", color: "inherit", minWidth: "16rem" }}
          />
          <button type="submit" className="primary-button" style={{ padding: "0.45rem 1rem" }}>Search</button>
        </form>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading users…</p>
      ) : error ? (
        <div className={cn("glass-panel", feedbackStyles.inlineError, feedbackStyles.inlineErrorGlass)} role="alert">
          <span className={feedbackStyles.inlineErrorIcon} aria-hidden="true">!</span>
          <p className={feedbackStyles.inlineErrorMessage}>{error}</p>
          <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={() => void load(search.trim())}>Retry</Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No users found.</p>
      ) : (
        <div className="glass-panel" style={{ overflowX: "auto", borderRadius: "0.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={cellStyle}>User</th>
                <th style={cellStyle}>Provider</th>
                <th style={cellStyle}>Projects</th>
                <th style={cellStyle}>Errors</th>
                <th style={cellStyle}>Joined</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{u.login}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {u.displayName ?? "—"}{u.email ? ` · ${u.email}` : ""}
                      </span>
                    </div>
                  </td>
                  <td style={cellStyle}>{u.provider}</td>
                  <td style={cellStyle}>{u.projectCount}</td>
                  <td style={cellStyle}>
                    <span className={`status-chip ${u.errorCount > 0 ? "status-chip-danger" : "status-chip-muted"}`}>
                      {u.errorCount}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(u.createdAt))}
                  </td>
                  <td style={cellStyle}>
                    <span className={`status-chip ${u.archivedAt ? "status-chip-amber" : "status-chip-success"}`}>
                      {u.archivedAt ? "archived" : "active"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <Link href={`/admin/users/${u.id}`} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const cellStyle: React.CSSProperties = { padding: "0.65rem 0.85rem", whiteSpace: "nowrap" };
