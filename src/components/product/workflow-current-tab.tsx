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
import { HelpTip } from "./help-tip";
import { DeploymentTargetsList } from "./workflow-deployment-targets-list";
import { WorkflowCurrentSubtabBar, type WorkflowCurrentSubtab } from "./workflow-current-navigation";
import {
  CiRunsList,
  DeploymentHistoryList,
  DriftFindingsPanel,
  EnvMetadataList,
  WorkflowStageList,
} from "./workflow-current-panels";
import { selectedChecks } from "./workflow-current-formatters";
import { WorkflowLatestResultBanner } from "./workflow-current-result-banner";
import { WorkflowHistoryPanel } from "./workflow-history-panel";
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
      className="tab-content-panel"
      id="workflow-panel-current"
      role="tabpanel"
      aria-labelledby="workflow-tab-current"
      tabIndex={0}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <dl className="project-detail-grid">
                      <div>
                        <dt>Workflow</dt>
                        <dd>{selectedOverview?.workflow.path ?? selectedProject.workflowPath}</dd>
                      </div>
                      <div>
                        <dt>Checks</dt>
                        <dd>{selectedChecks(selectedProject)}</dd>
                      </div>
                      {selectedProject.githubCommitSha ? (
                        <div>
                          <dt>Commit</dt>
                          <dd>{selectedProject.githubCommitSha.slice(0, 10)}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>Stages</dt>
                        <dd>{selectedWorkflowFiles.length ? `${selectedWorkflowFiles.length} gated workflow stages` : "Not configured"}</dd>
                      </div>
                      <div>
                        <dt>CI token</dt>
                        <dd>{selectedOverview?.ciAuth.status ?? "Not loaded"}</dd>
                      </div>
                      <div>
                        <dt>Targets</dt>
                        <dd>{selectedOverview ? selectedOverview.deploymentTargets.count : "Not loaded"}</dd>
                      </div>
                    </dl>

                    {syncSnapshot ? (
                      <div className="env-metadata-row provisioned" style={{ alignItems: "center" }}>
                        <span>
                          <strong>Local snapshot</strong>
                          <br />
                          {syncSnapshot.latest
                            ? `${syncSnapshot.latest.status} - ${syncSnapshot.latest.findings.length} finding${syncSnapshot.latest.findings.length === 1 ? "" : "s"} - ${formatDate(syncSnapshot.latest.completedAt)}`
                            : "Not synced yet"}
                        </span>
                        {syncAvailable ? (
                          <button
                            className="ghost-button target-action-btn"
                            type="button"
                            disabled={syncingProjectId === selectedProject.id}
                            onClick={handleProjectSync}
                          >
                            {syncingProjectId === selectedProject.id ? "Syncing…" : "Sync now"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {syncMessage ? (
                      <p className="error-text" style={{ margin: 0 }}>{syncMessage}</p>
                    ) : null}

                    {selectedProject.failureReason ? (
                      <p className="error-text" style={{ margin: 0 }}>
                        {selectedProject.failureReason}
                      </p>
                    ) : null}

                    {selectedOverview?.health.checks.length ? (
                      <div className="env-metadata-list" data-tour="sync-health">
                        {selectedOverview.health.checks.map((check) => (
                          <div key={check.key} className={`env-metadata-row ${check.status === "error" ? "failed" : "provisioned"}`}>
                            <span>{check.label}</span>
                            <span>{check.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {driftDetectionEnabled && selectedOverview?.capabilities.driftDetection ? (
                      driftError ? (
                        <p className="error-text" style={{ margin: 0 }}>{driftError}</p>
                      ) : (
                        <DriftFindingsPanel
                          onRun={() => void handleRunDriftDetection()}
                          onRepair={handleRepairDriftFinding}
                          repairEnabled={driftRepairEnabled}
                          response={driftResponse}
                          running={runningDriftCheck}
                          workflowUpdatePrEnabled={workflowUpdatePrEnabled}
                        />
                      )
                    ) : null}
                  </div>
                ) : null}

                {projectDetailTab === "workflow" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {workflowSettingsPreviewEnabled && selectedOverview?.capabilities.workflowSettings ? (
                      <div className="glass-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Workflow settings</h4>
                            <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                              Preview only
                            </p>
                          </div>
                          <button
                            className="ghost-button"
                            type="button"
                            disabled={!workflowSettings || previewingWorkflow}
                            onClick={handleWorkflowPreview}
                            style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                          >
                            {previewingWorkflow ? "Previewing..." : "Preview"}
                          </button>
                        </div>

                        {workflowSettings ? (
                          <div className="project-detail-grid">
                            <label>
                              <dt>Node version</dt>
                              <input
                                aria-label="Node version"
                                value={workflowSettings.nodeVersion}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    nodeVersion: event.target.value,
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>
                                Coverage threshold
                                <HelpTip text="The minimum percentage of code that unit tests must exercise. Pipeline runs fail the Quality stage if coverage drops below this number." />
                              </dt>
                              <input
                                aria-label="Coverage threshold"
                                type="number"
                                min={0}
                                max={100}
                                value={workflowSettings.coverageThreshold}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    coverageThreshold: Number(event.target.value),
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>
                                Service path
                                <HelpTip text="The folder inside the repository where this service's code lives. Used to scope which files trigger this workflow and where build commands run." />
                              </dt>
                              <input
                                aria-label="Service path"
                                value={workflowSettings.servicePath}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    servicePath: event.target.value,
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>
                                Central workflow ref
                                <HelpTip text="The branch or tag of ImplementSprint/central-workflow that this project's pipeline is pinned to. It supplies the reusable gated-stage logic — Access, Quality, Package — that every generated workflow calls into." />
                              </dt>
                              <input
                                aria-label="Central workflow ref"
                                value={workflowSettings.centralWorkflowRef}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    centralWorkflowRef: event.target.value,
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>Workflow recipe</dt>
                              <input
                                aria-label="Workflow recipe"
                                value={workflowSettings.workflowRecipeId ?? ""}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    workflowRecipeId: event.target.value || null,
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>Package manager</dt>
                              <select aria-label="Package manager" value={workflowSettings.packageManager} disabled>
                                <option value="npm">npm</option>
                              </select>
                            </label>
                            <label>
                              <dt>Lint</dt>
                              <input
                                aria-label="Lint"
                                type="checkbox"
                                checked={workflowSettings.checks.lint}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    checks: {
                                      ...workflowSettings.checks,
                                      lint: event.target.checked,
                                    },
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>Unit tests</dt>
                              <input
                                aria-label="Unit tests"
                                type="checkbox"
                                checked={workflowSettings.checks.unit}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    checks: {
                                      ...workflowSettings.checks,
                                      unit: event.target.checked,
                                    },
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>Build</dt>
                              <input
                                aria-label="Build"
                                type="checkbox"
                                checked={workflowSettings.checks.build}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    checks: {
                                      ...workflowSettings.checks,
                                      build: event.target.checked,
                                    },
                                  });
                                }}
                              />
                            </label>
                            <label>
                              <dt>Security</dt>
                              <input
                                aria-label="Security"
                                type="checkbox"
                                checked={workflowSettings.checks.security}
                                onChange={(event) => {
                                  setWorkflowSettings({
                                    ...workflowSettings,
                                    checks: {
                                      ...workflowSettings.checks,
                                      security: event.target.checked,
                                    },
                                  });
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <p className="env-empty-state">Loading workflow settings...</p>
                        )}

                        <div>
                          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem" }}>Deploy target mappings</h4>
                          {deploymentTargets.length ? (
                            <div className="env-metadata-list">
                              {deploymentTargets.map((target) => (
                                <div key={target.id} className="env-metadata-row provisioned">
                                  <span>{target.slot}</span>
                                  <span>{target.providerProjectName} / {target.branchName}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="env-empty-state">No deployment target mappings.</p>
                          )}
                        </div>

                        {workflowSettingsError ? (
                          <p className="error-text" style={{ margin: 0 }}>{workflowSettingsError}</p>
                        ) : null}

                        {workflowPreview?.validationWarnings.length ? (
                          <div className="env-metadata-list">
                            {workflowPreview.validationWarnings.map((warning) => (
                              <div key={`${warning.field}-${warning.message}`} className="env-metadata-row failed">
                                <span>{warning.field}</span>
                                <span>{warning.message}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {workflowPreview ? (
                          <>
                            <div className="env-metadata-list">
                              {workflowPreview.diffSummary.map((item) => (
                                <div key={item.path} className="env-metadata-row provisioned">
                                  <span>{item.path}</span>
                                  <span className={item.status === "changed" ? "dash-badge-violet" : "branch-chip"}>
                                    {item.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {workflowUpdatePrEnabled ? (
                              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                                <button
                                  className="primary-button"
                                  type="button"
                                  disabled={creatingWorkflowPr}
                                  onClick={handleCreateWorkflowPr}
                                  style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                                >
                                  {creatingWorkflowPr ? "Creating..." : "Create update PR"}
                                </button>
                                {workflowUpdatePr ? (
                                  <a
                                    className="ghost-button"
                                    href={workflowUpdatePr.pullRequestUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ minHeight: "2rem", padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                                  >
                                    {workflowUpdatePr.pullRequestUrl}
                                  </a>
                                ) : null}
                              </div>
                            ) : null}
                            {workflowUpdatePrError ? (
                              <p className="error-text" style={{ margin: 0 }}>{workflowUpdatePrError}</p>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    {selectedWorkflowFiles.length ? (
                      <WorkflowStageList files={selectedWorkflowFiles} />
                    ) : (
                      <p className="env-empty-state">No workflow file metadata is tracked yet.</p>
                    )}
                  </div>
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
