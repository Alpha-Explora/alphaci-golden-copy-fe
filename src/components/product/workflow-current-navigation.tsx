import { motion } from "framer-motion";

export type WorkflowCurrentSubtab = "projects" | "history";

interface WorkflowCurrentSubtabBarProps {
  historyCount: number;
  loadingHistory: boolean;
  loadingProjects: boolean;
  onSubTabChange: (tab: WorkflowCurrentSubtab) => void;
  projectsCount: number;
  subTab: WorkflowCurrentSubtab;
}

export function WorkflowCurrentSubtabBar({
  historyCount,
  loadingHistory,
  loadingProjects,
  onSubTabChange,
  projectsCount,
  subTab,
}: Readonly<WorkflowCurrentSubtabBarProps>) {
  return (
    <div className="current-subtab-bar" role="tablist" aria-label="Current tab sections" data-tour="subtab-bar">
      {(["projects", "history"] as WorkflowCurrentSubtab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`subtab-${tab}`}
          aria-controls={`subtab-panel-${tab}`}
          aria-selected={subTab === tab}
          onClick={() => onSubTabChange(tab)}
          className={`current-subtab-btn${subTab === tab ? " active" : ""}`}
        >
          {subTab === tab && (
            <motion.span
              layoutId="current-subtab-indicator"
              className="current-subtab-indicator"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              aria-hidden="true"
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>
            {tab === "projects" ? "Projects" : "History"}
          </span>
          {tab === "projects" && !loadingProjects && projectsCount > 0 && (
            <span className="current-subtab-count">{projectsCount}</span>
          )}
          {tab === "history" && !loadingHistory && historyCount > 0 && (
            <span className="current-subtab-count">{historyCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
