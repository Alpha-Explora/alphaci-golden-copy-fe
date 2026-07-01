import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PreviewDeploymentsPanel, type PreviewDeployment } from "../../src/components/product/preview-deployments-panel";

const previews: PreviewDeployment[] = [
  {
    id: "preview-1",
    previewUrl: "https://pr-42-alpha-demo.itsandbox.site",
    repositoryFullName: "alpha/demo",
    pullRequestNumber: 42,
    sourceBranch: "feature/payments",
    commitSha: "abcdef1234567890",
    lifecycleStatus: "healthy",
    cleanupStatus: "none",
    expiresAt: "2026-07-09T00:00:00.000Z",
    safeMessage: null,
  },
];

function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return { container, root };
}

describe("PreviewDeploymentsPanel", () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = null;
    container = null;
  });

  it("renders preview URL, PR source, health, expiration, and cleanup state", () => {
    const rendered = render(<PreviewDeploymentsPanel previews={previews} />);
    root = rendered.root;
    container = rendered.container;

    expect(container.textContent).toContain("https://pr-42-alpha-demo.itsandbox.site");
    expect(container.textContent).toContain("alpha/demo #42");
    expect(container.textContent).toContain("feature/payments");
    expect(container.textContent).toContain("abcdef1");
    expect(container.textContent).toContain("Healthy");
    expect(container.textContent).toContain("Cleanup not required");
    expect(container.textContent).toContain("2026-07-09");
  });

  it("uses safe failure messages only", () => {
    const rendered = render(
      <PreviewDeploymentsPanel
        previews={[
          {
            ...previews[0],
            lifecycleStatus: "failed",
            safeMessage: "Preview deploy failed during health check.",
          },
        ]}
      />,
    );
    root = rendered.root;
    container = rendered.container;

    expect(container.textContent).toContain("Preview deploy failed during health check.");
    expect(container.textContent).not.toContain("DATABASE_URL");
  });

  it("requests cleanup through the provided handler", () => {
    const onRequestCleanup = jest.fn();
    const rendered = render(<PreviewDeploymentsPanel previews={previews} onRequestCleanup={onRequestCleanup} />);
    root = rendered.root;
    container = rendered.container;

    const button = container.querySelector("button");
    act(() => button?.click());

    expect(onRequestCleanup).toHaveBeenCalledWith(previews[0]);
  });
});
