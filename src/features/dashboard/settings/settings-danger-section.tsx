import styles from "./settings-page.styles";
import { AlertTriangleIcon } from "./settings-icons";
import { SettingsSection } from "./settings-section";

interface SettingsDangerSectionProps {
  deleteConfirmInput: string;
  deleteMessage: string | null;
  isDeleting: boolean;
  isLoggingOut: boolean;
  logoutMessage: string | null;
  onArchiveAccount: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
  onLogout: () => void;
  setDeleteConfirmInput: (value: string) => void;
  showDeleteConfirm: boolean;
  username?: string | null;
}

export function SettingsDangerSection({
  deleteConfirmInput,
  deleteMessage,
  isDeleting,
  isLoggingOut,
  logoutMessage,
  onArchiveAccount,
  onCancelArchive,
  onConfirmArchive,
  onLogout,
  setDeleteConfirmInput,
  showDeleteConfirm,
  username,
}: Readonly<SettingsDangerSectionProps>) {
  return (
    <SettingsSection icon={<AlertTriangleIcon />} title="Danger Zone" index={0} danger>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Sign out of AlphaCI
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Your session will be terminated and you will be redirected to the home page.
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="confirm-btn-danger"
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", flexShrink: 0, cursor: isLoggingOut ? "not-allowed" : "pointer", opacity: isLoggingOut ? 0.6 : 1 }}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
        {logoutMessage && (
          <p className={`${styles.errorText} ${styles.errorTextRaised}`}>{logoutMessage}</p>
        )}

        <div style={{ borderTop: "1px solid rgba(248, 113, 113, 0.12)" }} />

        {!showDeleteConfirm ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Archive your account
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Your account and data are archived for 30 days. You can restore everything by signing in again within that window.
              </span>
            </div>
            <button
              type="button"
              onClick={onArchiveAccount}
              className="confirm-btn-danger"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", flexShrink: 0 }}
            >
              Archive my account
            </button>
          </div>
        ) : (
          <div style={{ background: "rgba(248, 113, 113, 0.05)", border: "1px solid rgba(248, 113, 113, 0.2)", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--danger)" }}>
                This will archive your account.
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Your account and all associated data will be archived, not immediately deleted. You can sign in with GitHub within{" "}
                <strong style={{ color: "var(--text-secondary)" }}>30 days</strong> to fully restore your account. After 30 days the archived account is permanently deleted.
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Your GitHub repositories and any workflow files committed to them are not affected</strong>. They remain on GitHub regardless of what you choose here.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label htmlFor="delete-confirm-input" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Type your username{" "}
                <strong style={{ color: "var(--text-primary)", fontFamily: "ui-monospace, monospace" }}>
                  {username}
                </strong>
                {" "}to confirm:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={deleteConfirmInput}
                onChange={(event) => setDeleteConfirmInput(event.target.value)}
                placeholder={username ?? "username"}
                autoComplete="off"
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  fontFamily: "ui-monospace, monospace",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={onConfirmArchive}
                disabled={isDeleting || deleteConfirmInput !== username}
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#fff",
                  padding: "0.45rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(248, 113, 113, 0.6)",
                  background: isDeleting || deleteConfirmInput !== username ? "rgba(248, 113, 113, 0.2)" : "rgba(248, 113, 113, 0.7)",
                  cursor: isDeleting || deleteConfirmInput !== username ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {isDeleting ? "Archiving..." : "Archive my account"}
              </button>
              <button
                type="button"
                onClick={onCancelArchive}
                disabled={isDeleting}
                className="confirm-btn-neutral"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}
              >
                Cancel
              </button>
            </div>
            {deleteMessage && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--danger)" }}>{deleteMessage}</p>
            )}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
