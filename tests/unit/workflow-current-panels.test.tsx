import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  CiRunsList,
  DeploymentHistoryList,
  EnvMetadataList,
  WorkflowStageList,
} from "../../src/components/product/workflow-current-panels";
import type {
  EnvVarMetadata,
  ProjectCiRunsResponse,
  ProjectDeploymentsResponse,
  WorkflowFileMetadata,
} from "../../src/lib/api/contracts";

describe("workflow current panel components", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders workflow stage and environment metadata lists", () => {
    const files: WorkflowFileMetadata[] = [
      {
        path: ".github/workflows/quality.yml",
        name: "quality",
        stage: "quality",
        gated: true,
      },
    ];
    const metadata: EnvVarMetadata[] = [
      {
        id: "env-1",
        projectId: "project-1",
        deploymentTargetId: "target-1",
        environment: "test",
        key: "DATABASE_URL",
        provider: "render",
        valueStored: false,
        lastProvisionedAt: "2026-07-01T00:00:00.000Z",
        lastProvisionedBy: "AlphaCI",
        status: "provisioned",
        errorSummary: null,
      },
    ];

    act(() => {
      root.render(
        <>
          <WorkflowStageList files={files} />
          <EnvMetadataList metadata={metadata} />
        </>,
      );
    });

    expect(container.textContent).toContain("1 gated workflow stages");
    expect(container.textContent).toContain(".github/workflows/quality.yml");
    expect(container.textContent).toContain("DATABASE_URL");
    expect(container.textContent).toContain("test - provisioned");
  });

  it("renders CI and deployment empty states without live sync", () => {
    const runs: ProjectCiRunsResponse = {
      enabled: true,
      mode: "local_mock",
      liveGithubEnabled: false,
      githubActionsUrl: "https://github.com/acme/app/actions",
      runs: [],
    };
    const deployments: ProjectDeploymentsResponse = {
      enabled: true,
      mode: "local_mock",
      liveProvidersEnabled: false,
      deployments: [],
    };

    act(() => {
      root.render(
        <>
          <CiRunsList response={runs} />
          <DeploymentHistoryList response={deployments} />
        </>,
      );
    });

    expect(container.textContent).toContain("Live GitHub run sync is not enabled");
    expect(container.textContent).toContain("No CI runs tracked yet.");
    expect(container.textContent).toContain("Live deployment sync is not enabled");
    expect(container.textContent).toContain("No deployment history tracked yet.");
  });

  it("renders linked failed run and provider deployment rows", () => {
    const runs: ProjectCiRunsResponse = {
      enabled: true,
      mode: "local_mock",
      liveGithubEnabled: true,
      githubActionsUrl: "https://github.com/acme/app/actions",
      runs: [
        {
          id: "run-1",
          stage: "quality",
          workflowName: "AlphaCI Quality",
          branch: "test",
          commitSha: "abc123",
          actor: "flowci-local",
          status: "completed",
          conclusion: "failure",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:05:00.000Z",
          htmlUrl: "https://github.com/acme/app/actions/runs/1",
          canRerun: false,
        },
      ],
    };
    const deployments: ProjectDeploymentsResponse = {
      enabled: true,
      mode: "local_mock",
      liveProvidersEnabled: true,
      deployments: [
        {
          id: "deployment-1",
          targetId: "target-1",
          targetName: "orders-api-test",
          provider: "render",
          environment: "test",
          branch: "test",
          commitSha: "abc123",
          status: "failed",
          createdAt: "2026-07-01T00:00:00.000Z",
          readyAt: null,
          providerUrl: "https://dashboard.render.com/web/orders-api-test",
        },
      ],
    };

    act(() => {
      root.render(
        <>
          <CiRunsList response={runs} />
          <DeploymentHistoryList response={deployments} />
        </>,
      );
    });

    expect(container.textContent).toContain("AlphaCI Quality");
    expect(container.textContent).toContain("quality - test - completed - failure");
    expect(container.querySelector('a[href="https://github.com/acme/app/actions/runs/1"]')).not.toBeNull();
    expect(container.textContent).not.toContain("Rerun");
    expect(container.textContent).toContain("orders-api-test");
    expect(container.textContent).toContain("render - test - failed");
    expect(container.querySelector('a[href="https://dashboard.render.com/web/orders-api-test"]')).not.toBeNull();
  });
});
