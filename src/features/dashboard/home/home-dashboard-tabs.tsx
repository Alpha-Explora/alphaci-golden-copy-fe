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
      <div className="dash-tab-bar" role="tablist" aria-label="Dashboard sections" style={{
        position: "relative",
        display: "flex",
        gap: "0.25rem",
        padding: "0.25rem",
        background: "rgba(15, 23, 42, 0.4)",
        border: "1px solid var(--border-soft)",
        borderRadius: "0.6rem",
        width: "fit-content",
      }}>
        {(["overview", "repositories", "activity"] as DashTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`dash-tab-${tab}`}
            aria-controls={`dash-panel-${tab}`}
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            style={{
              position: "relative",
              padding: "0.45rem 1.2rem",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "color 0.2s ease",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
              zIndex: 1,
              fontWeight: 600,
              fontSize: "0.85rem",
              fontFamily: "inherit",
            }}
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
