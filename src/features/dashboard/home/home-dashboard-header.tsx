"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { AuthMeResponse } from "@/lib/api/contracts";

import { PipelineTrack, sectionVariants } from "./home-bento-grid";

interface HomeDashboardHeaderProps {
  avatarInitial: string;
  error: string | null;
  guest: boolean;
  logoutMessage: string | null;
  prefersReducedMotion: boolean | null;
  session: AuthMeResponse | null;
}

export function HomeDashboardHeader({
  avatarInitial,
  error,
  guest,
  logoutMessage,
  prefersReducedMotion,
  session,
}: Readonly<HomeDashboardHeaderProps>) {
  return (
    <motion.section
      className="welcome-banner-flat"
      aria-label="Welcome"
      custom={0}
      variants={sectionVariants}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
    >
      <div className="welcome-banner-flat-accent" aria-hidden="true" />

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!guest && (session?.user.avatarUrl ? (
            <Image
              src={session.user.avatarUrl}
              alt={session.user.name ?? session.user.login}
              className="size-11 shrink-0 rounded-full border-2 border-[var(--border-brand)] object-cover shadow-[0_0_12px_var(--brand-glow)]"
              width={44}
              height={44}
              unoptimized
            />
          ) : (
            <span aria-hidden="true" style={{
              width: 44,
              height: 44,
              fontSize: "1.15rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "var(--brand-light)",
              border: "2px solid var(--border-brand)",
              color: "var(--brand)",
            }}>{avatarInitial}</span>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--brand)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              SYSTEM.DASHBOARD
            </p>
            <h1 style={{ padding: 0, border: "none", margin: 0, fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)", fontWeight: 800 }}>
              {guest
                ? "AlphaCI Dashboard"
                : `Welcome back, ${session?.user.name ?? session?.user.login ?? "builder"}.`}
            </h1>
          </div>
        </div>

        <div style={{
          borderLeft: "1px solid var(--border)",
          paddingLeft: "clamp(0.75rem, 1.5vw, 1.25rem)",
          alignSelf: "start",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }} className="pipeline-track-aside">
          <p className="eyebrow" style={{ fontSize: "0.7rem" }}>LIVE STATUS PIPELINE</p>
          <PipelineTrack reduced={prefersReducedMotion} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid var(--border-soft)", paddingTop: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {guest
            ? "You are browsing in guest mode. Sign up to unlock all features."
            : (
              <>Connected on{" "}
                <Badge tone="accent" dot>
                  {session?.subscription.plan ?? "pro"}
                </Badge>
              </>
            )}
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {guest ? (
            <>
              <ButtonLink href="/signup" size="sm">Sign up free</ButtonLink>
              <ButtonLink href="/login" size="sm" variant="ghost">Log in</ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/workflows" size="sm">Create project</ButtonLink>
              <ButtonLink href="/settings" size="sm" variant="ghost">Subscription</ButtonLink>
            </>
          )}
        </div>
      </div>

      {error ? <p className="error-text" style={{ marginTop: "1rem" }}>{error}</p> : null}
      {logoutMessage ? <p className="error-text" style={{ marginTop: "1rem" }}>{logoutMessage}</p> : null}
    </motion.section>
  );
}
