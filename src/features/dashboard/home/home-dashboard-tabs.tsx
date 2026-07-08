"use client";

import { motion } from "framer-motion";

import { sectionVariants, type DashTab } from "./home-bento-grid";

interface HomeDashboardTabsProps {
  activeTab: DashTab;
  onTabChange: (tab: DashTab) => void;
  prefersReducedMotion: boolean | null;
}

export function HomeDashboardTabs({ activeTab, onTabChange, prefersReducedMotion }: Readonly<HomeDashboardTabsProps>) {
  return (
    <motion.div
      custom={1}
      variants={sectionVariants}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
    >
      <div
        className="relative flex w-fit gap-1 rounded-[0.6rem] border border-[var(--border-soft)] bg-slate-900/40 p-1"
        role="tablist"
        aria-label="Dashboard sections"
      >
        {(["overview", "repositories", "activity"] as DashTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`dash-tab-${tab}`}
            aria-controls={`dash-panel-${tab}`}
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className="relative z-[1] cursor-pointer border-0 bg-transparent px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors aria-selected:text-[var(--text-primary)]"
          >
            {activeTab === tab && (
              <motion.span
                layoutId="dash-tab-indicator"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.4rem",
                  background: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  boxShadow: "0 0 12px rgba(56, 189, 248, 0.15)",
                  zIndex: -1,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {tab === "overview" ? "Overview" : tab === "repositories" ? "Repositories" : "Activity"}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
