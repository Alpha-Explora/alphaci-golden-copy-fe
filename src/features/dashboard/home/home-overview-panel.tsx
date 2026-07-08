"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

import { BentoGrid, EASE_OUT } from "./home-bento-grid";

interface HomeOverviewPanelProps {
  guest: boolean;
  historyError: string | null;
  historyLength: number;
  historyLoading: boolean;
  lastActivityValue: string;
  loadHistory: () => void;
  loadProjects: () => void;
  prefersReducedMotion: boolean | null;
  projectsError: string | null;
  projectsLength: number;
  projectsLoading: boolean;
  uniqueServices: number;
}

export function HomeOverviewPanel({
  guest,
  historyError,
  historyLength,
  historyLoading,
  lastActivityValue,
  loadHistory,
  loadProjects,
  prefersReducedMotion,
  projectsError,
  projectsLength,
  projectsLoading,
  uniqueServices,
}: Readonly<HomeOverviewPanelProps>) {
  return (
    <motion.div
      key="overview"
      id="dash-panel-overview"
      role="tabpanel"
      aria-labelledby="dash-tab-overview"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <section aria-label="Release pulse">
        <BentoGrid
          historyLoading={historyLoading}
          projectsLoading={projectsLoading}
          historyLength={historyLength}
          projectsLength={projectsLength}
          uniqueServices={uniqueServices}
          lastActivityValue={lastActivityValue}
          prefersReducedMotion={prefersReducedMotion}
        />
      </section>

      {!guest && projectsError ? (
        <div className="error-inline glass-panel" role="alert" style={{ background: "rgba(248, 113, 113, 0.05)", border: "1px solid rgba(248, 113, 113, 0.2)", borderRadius: "10px" }}>
          <span className="error-inline-icon" aria-hidden="true" style={{ color: "var(--danger)" }}>!</span>
          <p className="error-inline-msg" style={{ margin: 0, fontSize: "0.82rem" }}>{projectsError}</p>
          <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={loadProjects}>Retry</Button>
        </div>
      ) : null}
      {!guest && historyError ? (
        <div className="error-inline glass-panel" role="alert" style={{ background: "rgba(248, 113, 113, 0.05)", border: "1px solid rgba(248, 113, 113, 0.2)", borderRadius: "10px" }}>
          <span className="error-inline-icon" aria-hidden="true" style={{ color: "var(--danger)" }}>!</span>
          <p className="error-inline-msg" style={{ margin: 0, fontSize: "0.82rem" }}>{historyError}</p>
          <Button variant="danger" size="sm" className="min-h-0 shrink-0 rounded-[0.55rem] px-[0.65rem] py-1 text-[0.78rem]" onClick={loadHistory}>Retry</Button>
        </div>
      ) : null}
    </motion.div>
  );
}
