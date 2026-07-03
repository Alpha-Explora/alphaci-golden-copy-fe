"use client";

import Link from "next/link";

import type { ProvisionedProject } from "@/lib/api/contracts";
import { statusVariant } from "./workflow-current-formatters";

export type ProjectDetailTab =
  | "overview"
  | "workflow"
  | "runs"
  | "deployments"
  | "environment"
  | "activity"
  | "audit"
  | "settings";

export const PROJECT_DETAIL_TABS: Array<{ id: ProjectDetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "workflow", label: "Workflow" },
  { id: "runs", label: "Runs" },
  { id: "deployments", label: "Deployments" },
  { id: "environment", label: "Environment" },
  { id: "activity", label: "Activity" },
  { id: "audit", label: "Audit" },
  { id: "settings", label: "Settings" },
];

export function WorkflowProjectDetailHeader({ project }: Readonly<{ project: ProvisionedProject }>) {
  return (
    <>
      <div className="project-detail-header">
        <div>
          <h3>{project.repoFullName}</h3>
          <p>{project.serviceName}</p>
        </div>
        <span className="project-detail-header-badges">
          {project.isExample ? <span className="project-demo-badge">Demo · read-only</span> : null}
          <span className={`project-status-badge ${statusVariant(project.status)}`}>{project.status}</span>
        </span>
      </div>

      {project.isExample ? (
        <p className="project-demo-note">
          This is a read-only demo project AlphaCI seeds for every account. It shows how a provisioned project looks
          end to end — the gated stages, promotion flow, and deploys explained in the{" "}
          <Link href="/guide#branch-strategy" className="inline-link">
            guide
          </Link>{" "}
          — but it is not connected to a real GitHub repository. Create your own project to run a live pipeline.
        </p>
      ) : null}
    </>
  );
}

export function WorkflowProjectDetailActions({
  envProvisioningEnabled,
  onEnvironmentSelected,
  project,
}: Readonly<{
  envProvisioningEnabled: boolean;
  onEnvironmentSelected: () => void;
  project: ProvisionedProject;
}>) {
  return (
    <div className="project-detail-actions">
      {project.repoUrl ? (
        <>
          <a className="ghost-button" href={project.repoUrl} target="_blank" rel="noreferrer">
            Repo
          </a>
          <a className="ghost-button" href={`${project.repoUrl}/actions`} target="_blank" rel="noreferrer">
            Actions
          </a>
        </>
      ) : null}
      {project.githubCommitUrl ? (
        <a className="ghost-button" href={project.githubCommitUrl} target="_blank" rel="noreferrer">
          Commit
        </a>
      ) : null}
      {envProvisioningEnabled && project.status === "provisioned" && !project.isExample ? (
        <button className="ghost-button env-action-button" type="button" onClick={onEnvironmentSelected}>
          Environment Variables
        </button>
      ) : null}
    </div>
  );
}

export function WorkflowProjectDetailTabs({
  activeTab,
  onTabSelected,
  tabs,
}: Readonly<{
  activeTab: ProjectDetailTab;
  onTabSelected: (tab: ProjectDetailTab) => void;
  tabs: Array<{ id: ProjectDetailTab; label: string }>;
}>) {
  return (
    <div className="project-inner-tabs" role="tablist" aria-label="Project detail sections" data-tour="project-detail-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`project-inner-tab${activeTab === tab.id ? " active" : ""}`}
          onClick={() => onTabSelected(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
