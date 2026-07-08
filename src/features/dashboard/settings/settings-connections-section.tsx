"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  type ConnectedIdentityMethod,
  getConnectedIdentities,
} from "@/lib/api/auth";

import { ExternalLinkIcon, GithubIcon } from "./settings-icons";
import styles from "./settings-page.styles";
import { SettingsSection } from "./settings-section";

interface SettingsConnectionsSectionProps {
  initialMethods?: ConnectedIdentityMethod[];
}

const providerLabels: Record<ConnectedIdentityMethod["provider"], string> = {
  email: "Email and password",
  google: "Google",
  github: "GitHub",
};

export function SettingsConnectionsSection({
  initialMethods,
}: Readonly<SettingsConnectionsSectionProps>) {
  const [methods, setMethods] = useState<ConnectedIdentityMethod[] | null>(
    initialMethods ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMethods) {
      return;
    }

    let active = true;
    getConnectedIdentities()
      .then((result) => {
        if (!active) return;
        setMethods(result.methods);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setMethods([]);
        setError("Sign-in methods are unavailable right now.");
      });

    return () => {
      active = false;
    };
  }, [initialMethods]);

  const hasGitHubSignIn = useMemo(
    () => methods?.some((method) => method.provider === "github") ?? false,
    [methods],
  );

  return (
    <>
      <SettingsSection icon={<GithubIcon />} title="Connected sign-in methods" index={0}>
        <div className="flex flex-col gap-3">
          {hasGitHubSignIn ? (
            <p className={styles.secondaryText}>
              GitHub sign-in is connected. Repository access is managed separately.
            </p>
          ) : (
            <p className={styles.secondaryText}>
              Sign-in methods are linked to your AlphaCI account by verified email.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {methods === null ? (
              <div className="rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-muted)]">
                Loading sign-in methods
              </div>
            ) : null}

            {methods?.map((method) => (
              <div
                key={`${method.provider}-${method.email ?? "none"}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-elevated)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">
                    {providerLabels[method.provider]}
                  </p>
                  {method.email ? (
                    <p className="m-0 truncate text-xs text-[var(--text-muted)]">
                      {method.email}
                    </p>
                  ) : null}
                </div>
                <Badge tone={method.emailVerified ? "success" : "warning"} dot>
                  {method.emailVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
            ))}

            {methods?.length === 0 ? (
              <div className="rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-muted)]">
                No connected sign-in methods found.
              </div>
            ) : null}
          </div>

          {error ? <p className={styles.messageDanger}>{error}</p> : null}
        </div>
      </SettingsSection>

      <SettingsSection icon={<GithubIcon />} title="GitHub Connection" index={1}>
        <div className={styles.splitRow}>
          <div className={styles.textStack}>
            <div className={styles.inlineRow}>
              <span className="dash-status-active" />
              <span className={styles.primaryText}>GitHub App connected</span>
            </div>
            <p className={styles.secondaryText}>
              Manage your GitHub App connection from the Create Project page.
            </p>
          </div>
          <ButtonLink
            href="/workflows"
            size="sm"
            variant="ghost"
            trailingIcon={<ExternalLinkIcon size={11} />}
          >
            Manage
          </ButtonLink>
        </div>
      </SettingsSection>
    </>
  );
}
