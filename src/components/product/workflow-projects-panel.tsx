"use client";
import { feedbackStyles } from "@/components/ui/feedback-styles";
import { cn } from "@/lib/utils";

import { InlineLink } from "@/components/ui/inline-link";
import type { ProvisionedProject } from "@/lib/api/contracts";
import { FlowExplainer } from "./flow-explainer";
import { statusVariant } from "./workflow-current-formatters";

export function WorkflowProjectsLoadingState() {
  return (
    <div className="repo-grid">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          data-slot="skeleton-card" className={cn(feedbackStyles.skeletonCard, "min-h-48")}
        />
      ))}
    </div>
  );
}

export function WorkflowProjectsEmptyState({ onOpenSetup }: Readonly<{ onOpenSetup: () => void }>) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        background: "rgba(15, 23, 42, 0.3)",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        alignItems: "center",
      }}
    >
      <div>
        <p style={{ color: "var(--text-primary)", margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 700 }}>
          No provisioned projects yet.
        </p>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.85rem", maxWidth: "32rem" }}>
          When you create one, AlphaCI provisions the repository and commits a workflow that runs through the gated
          stages below on every change. A read-only demo project normally appears here too — open the{" "}
          <InlineLink href="/guide">
            guide
          </InlineLink>{" "}
          to see how it all fits together.
        </p>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "32rem",
          padding: "1rem",
          borderRadius: "var(--radius-card)",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <FlowExplainer variant="compact" />
      </div>
      <button
        className="primary-button"
        type="button"
        onClick={onOpenSetup}
        style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", minHeight: "2.5rem" }}
      >
        Create your first project
      </button>
    </div>
  );
}

export function WorkflowProjectList({
  onOpenSetup,
  onProjectSelected,
  projects,
  selectedProject,
}: Readonly<{
  onOpenSetup: () => void;
  onProjectSelected: (projectId: string) => void;
  projects: ProvisionedProject[];
  selectedProject: ProvisionedProject;
}>) {
  return (
    <aside className="project-list" aria-label="Provisioned projects" data-tour="projects-list">
      <div className="project-list-header">
        <span>Projects</span>
        <button className="ghost-button" type="button" onClick={onOpenSetup}>
          New
        </button>
      </div>
      {projects.map((project) => {
        const isSelected = selectedProject.id === project.id;
        return (
          <button
            key={project.id}
            className={`project-list-item${isSelected ? " selected" : ""}`}
            data-project-id={project.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onProjectSelected(project.id)}
          >
            <span className="project-list-title">
              {project.repoFullName.split("/")[1] ?? project.repoFullName}
            </span>
            <span className="project-list-meta">{project.serviceName}</span>
            <span className="project-list-badges">
              {project.isExample ? <span className="project-demo-badge">Demo</span> : null}
              <span className={`project-status-badge ${statusVariant(project.status)}`}>{project.status}</span>
            </span>
          </button>
        );
      })}
    </aside>
  );
}
