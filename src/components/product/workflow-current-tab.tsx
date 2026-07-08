"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { useCapabilities } from "@/hooks/use-capabilities";
import type {
  CreateProjectResult,
  ProvisionedProject,
  WorkflowHistoryItem,
} from "@/lib/api/contracts";
import { ProjectEnvPanel } from "./project-env-panel";
import { DeploymentTargetsList } from "./workflow-deployment-targets-list";
import { WorkflowCurrentSubtabBar, type WorkflowCurrentSubtab } from "./workflow-current-navigation";
import {
  CiRunsList,
  DeploymentHistoryList,
  EnvMetadataList,
} from "./workflow-current-panels";
import { WorkflowLatestResultBanner } from "./workflow-current-result-banner";
import { WorkflowHistoryPanel } from "./workflow-history-panel";
import { WorkflowProjectOverviewPanel } from "./workflow-project-overview-panel";
import { WorkflowProjectWorkflowPanel } from "./workflow-project-workflow-panel";
import {
  PROJECT_DETAIL_TABS,
  WorkflowProjectDetailActions,
  WorkflowProjectDetailHeader,
  WorkflowProjectDetailTabs,
  type ProjectDetailTab,
} from "./workflow-project-detail-shell";
import {
  WorkflowProjectList,
  WorkflowProjectsEmptyState,
  WorkflowProjectsLoadingState,
} from "./workflow-projects-panel";
import { useWorkflowProjectOverview } from "./use-workflow-project-overview";
import { useWorkflowProjectTelemetry } from "./use-workflow-project-telemetry";
import { useWorkflowSettingsPreview } from "./use-workflow-settings-preview";

import { formatDate } from "./workflow-builder-utils";
import { workflowTabPanelStyles as tabPanelStyles } from "./workflow-tab-panel.styles";

interface WorkflowCurrentTabProps {
  history: WorkflowHistoryItem[];
  latestResult: CreateProjectResult | null;
  loadingHistory: boolean;
  loadingProjects: boolean;
  onCopyYaml: (yaml: string) => void;
  onDownloadYaml: (yaml: string, fileName: string) => void;
  onOpenSetup: () => void;
  projects: ProvisionedProject[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } }
};

export function WorkflowCurrentTab({
  history,
  latestResult,
  loadingHistory,
  loadingProjects,
  onCopyYaml,
  onDownloadYaml,
  onOpenSetup,
  projects,
}: Readonly<WorkflowCurrentTabProps>) {
  const [subTab, setSubTab] = useState<WorkflowCurrentSubtab>("projects");
  const [projectDetailTab, setProjectDetailTab] = useState<ProjectDetailTab>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const {
    envProvisioningEnabled,
    ciRunTrackingEnabled,
    deploymentHistoryEnabled,
    driftDetectionEnabled,
    driftRepairEnabled,
    projectTargetManagementEnabled,
    projectSyncSnapshotsEnabled,
    workflowSettingsPreviewEnabled,
    workflowUpdatePrEnabled,
  } = useCapabilities();
  const {
    deploymentTargets,
    envMetadata,
    handleProjectSync,
    handleTargetChanged,
    handleTargetDetached,
    loadingProjectOverview,
    selectedOverview,
    selectedOverviewError,
    selectedProject,
    selectedWorkflowFiles,
    syncAvailable,
    syncMessage,
    syncingProjectId,
    syncSnapshot,
  } = useWorkflowProjectOverview({
    projectSyncSnapshotsEnabled,
    projects,
    selectedProjectId,
  });
  const {
    creatingWorkflowPr,
    handleCreateWorkflowPr,
    handleWorkflowPreview,
    previewingWorkflow,
    setWorkflowSettings,
    workflowPreview,
    workflowSettings,
    workflowSettingsError,
    workflowUpdatePr,
    workflowUpdatePrError,
  } = useWorkflowSettingsPreview({
    selectedProject,
    workflowSettingsPreviewEnabled,
    workflowTabActive: projectDetailTab === "workflow",
  });
  const {
    auditError,
    auditResponse,
    ciRunsError,
    ciRunsResponse,
    deploymentsError,
    deploymentsResponse,
    driftError,
    driftResponse,
    handleRepairDriftFinding,
    handleRunDriftDetection,
    runningDriftCheck,
  } = useWorkflowProjectTelemetry({
    ciRunTrackingEnabled,
    deploymentHistoryEnabled,
    driftDetectionEnabled,
    projectDetailTab,
    selectedOverview,
    selectedProject,
  });

  return (
    <motion.section
      className={tabPanelStyles.panel}
      id="workflow-panel-current"
      role="tabpanel"
      aria-labelledby="workflow-tab-current"
      tabIndex={0}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {latestResult ? <WorkflowLatestResultBanner result={latestResult} /> : null}

      <WorkflowCurrentSubtabBar
        historyCount={history.length}
        loadingHistory={loadingHistory}
        loadingProjects={loadingProjects}
        onSubTabChange={setSubTab}
        projectsCount={projects.length}
        subTab={subTab}
      />

      {subTab === "projects" && (
        <div
          id="subtab-panel-projects"
          role="tabpanel"
          aria-labelledby="subtab-projects"
        >
          {loadingProjects ? (
            <WorkflowProjectsLoadingState />
          ) : projects.length === 0 ? (
            <WorkflowProjectsEmptyState onOpenSetup={onOpenSetup} />
          ) : selectedProject ? (
            <motion.div
              className="project-workspace"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <WorkflowProjectList
                onOpenSetup={onOpenSetup}
                onProjectSelected={(projectId) => {
                  setSelectedProjectId(projectId);
                  setProjectDetailTab("overview");
                }}
                projects={projects}
                selectedProject={selectedProject}
              />

              <motion.article
                key={selectedProject.id}
                variants={cardVariants}
                className="project-detail-panel"
              >
                <WorkflowProjectDetailHeader project={selectedProject} />
                <WorkflowProjectDetailActions
                  envProvisioningEnabled={envProvisioningEnabled}
                  onEnvironmentSelected={() => setProjectDetailTab("environment")}
                  project={selectedProject}
                />
                <WorkflowProjectDetailTabs
                  activeTab={projectDetailTab}
                  onTabSelected={setProjectDetailTab}
                  tabs={PROJECT_DETAIL_TABS}
                />

                {loadingProjectOverview ? (
                  <p className="env-empty-state">Loading project overview...</p>
                ) : null}
                {selectedOverviewError ? (
                  <p className="error-text" style={{ margin: 0 }}>{selectedOverviewError}</p>
                ) : null}

                {projectDetailTab === "overview" ? (
                  <WorkflowProjectOverviewPanel
                    driftDetectionEnabled={driftDetectionEnabled}
                    driftError={driftError}
                    driftRepairEnabled={driftRepairEnabled}
                    driftResponse={driftResponse}
                    onProjectSync={handleProjectSync}
                    onRepairDriftFinding={handleRepairDriftFinding}
                    onRunDriftDetection={() => void handleRunDriftDetection()}
                    project={selectedProject}
                    runningDriftCheck={runningDriftCheck}
                    selectedOverview={selectedOverview}
                    selectedWorkflowFiles={selectedWorkflowFiles}
                    syncAvailable={syncAvailable}
                    syncMessage={syncMessage}
                    syncingProjectId={syncingProjectId}
                    syncSnapshot={syncSnapshot}
                    workflowUpdatePrEnabled={workflowUpdatePrEnabled}
                  />
                ) : null}

                {projectDetailTab === "workflow" ? (
                  <WorkflowProjectWorkflowPanel
                    creatingWorkflowPr={creatingWorkflowPr}
                    deploymentTargets={deploymentTargets}
                    onCreateWorkflowPr={handleCreateWorkflowPr}
                    onWorkflowPreview={handleWorkflowPreview}
                    previewingWorkflow={previewingWorkflow}
                    selectedWorkflowFiles={selectedWorkflowFiles}
                    setWorkflowSettings={setWorkflowSettings}
                    workflowPreview={workflowPreview}
                    workflowSettings={workflowSettings}
                    workflowSettingsCapable={selectedOverview?.capabilities.workflowSettings === true}
                    workflowSettingsError={workflowSettingsError}
                    workflowSettingsPreviewEnabled={workflowSettingsPreviewEnabled}
                    workflowUpdatePr={workflowUpdatePr}
                    workflowUpdatePrEnabled={workflowUpdatePrEnabled}
                    workflowUpdatePrError={workflowUpdatePrError}
                  />
                ) : null}

                {projectDetailTab === "runs" ? (
                  ciRunTrackingEnabled && selectedOverview?.capabilities.ciRunTracking ? (
                    ciRunsError ? (
                      <p className="error-text" style={{ margin: 0 }}>{ciRunsError}</p>
                    ) : (
                      <CiRunsList response={ciRunsResponse} />
                    )
                  ) : (
                    <p className="env-empty-state">CI run tracking is not enabled.</p>
                  )
                ) : null}

                {projectDetailTab === "deployments" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {deploymentHistoryEnabled && selectedOverview?.capabilities.deploymentHistory ? (
                      deploymentsError ? (
                        <p className="error-text" style={{ margin: 0 }}>{deploymentsError}</p>
                      ) : (
                        <DeploymentHistoryList response={deploymentsResponse} />
                      )
                    ) : (
                      <p className="env-empty-state">Deployment history is not enabled.</p>
                    )}
                    <DeploymentTargetsList
                      managementEnabled={projectTargetManagementEnabled}
                      onDetached={handleTargetDetached}
                      onTargetChanged={handleTargetChanged}
                      projectId={selectedProject.id}
                      targets={deploymentTargets}
                    />
                  </div>
                ) : null}

                {projectDetailTab === "environment" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {envProvisioningEnabled && selectedProject.status === "provisioned" ? (
                      <ProjectEnvPanel project={selectedProject} />
                    ) : (
                      <EnvMetadataList metadata={envMetadata} />
                    )}
                  </div>
                ) : null}

                {projectDetailTab === "activity" ? (
                  <div className="env-metadata-list">
                    {selectedProject.githubCommitUrl ? (
                      <div className="env-metadata-row provisioned">
                        <span>Latest workflow commit</span>
                        <span>{selectedProject.githubCommitSha?.slice(0, 10) ?? "Unknown"}</span>
                      </div>
                    ) : null}
                    {syncSnapshot?.latest ? (
                      <div className="env-metadata-row provisioned">
                        <span>Last local snapshot</span>
                        <span>{formatDate(syncSnapshot.latest.completedAt)}</span>
                      </div>
                    ) : null}
                    {!selectedProject.githubCommitUrl && !syncSnapshot?.latest ? (
                      <p className="env-empty-state">No activity events yet.</p>
                    ) : null}
                  </div>
                ) : null}

                {projectDetailTab === "audit" ? (
                  auditError ? (
                    <p className="error-text" style={{ margin: 0 }}>{auditError}</p>
                  ) : auditResponse?.items.length ? (
                    <div className="env-metadata-list">
                      {auditResponse.items.map((event) => (
                        <div key={event.id} className="env-metadata-row provisioned">
                          <span>{event.eventCode}</span>
                          <span>{event.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="env-empty-state">No audit events yet.</p>
                  )
                ) : null}

                {projectDetailTab === "settings" ? (
                  <dl className="project-detail-grid">
                    <div>
                      <dt>Project ID</dt>
                      <dd>{selectedProject.id}</dd>
                    </div>
                    <div>
                      <dt>Repository</dt>
                      <dd>{selectedProject.repoFullName}</dd>
                    </div>
                    <div>
                      <dt>Project type</dt>
                      <dd>{selectedProject.projectTypeId ?? "Not configured"}</dd>
                    </div>
                    <div>
                      <dt>Workflow recipe</dt>
                      <dd>{selectedProject.workflowRecipeId ?? "Not configured"}</dd>
                    </div>
                    <div>
                      <dt>Visibility</dt>
                      <dd>{selectedProject.visibility ?? "Not configured"}</dd>
                    </div>
                    <div>
                      <dt>Repo shape</dt>
                      <dd>{selectedProject.repoShape ?? "Not configured"}</dd>
                    </div>
                  </dl>
                ) : null}
              </motion.article>
            </motion.div>
          ) : null}
        </div>
      )}

      {subTab === "history" && (
        <div id="subtab-panel-history" role="tabpanel" aria-labelledby="subtab-history">
          <WorkflowHistoryPanel history={history} loadingHistory={loadingHistory} onCopyYaml={onCopyYaml} onDownloadYaml={onDownloadYaml} onOpenSetup={onOpenSetup} />
        </div>
      )}
    </motion.section>
  );
}
