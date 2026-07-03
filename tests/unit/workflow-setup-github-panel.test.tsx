import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WorkflowSetupGithubPanel } from "../../src/components/product/workflow-setup-github-panel";

function changeValue(element: HTMLInputElement, value: string) {
  act(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("workflow setup GitHub panel", () => {
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

  it("renders install state, accounts, repos, and links installation IDs", () => {
    const setInstallationId = jest.fn();
    const handleLinkInstallation = jest.fn();

    act(() => {
      root.render(
        <WorkflowSetupGithubPanel
          github={{
            handleLinkInstallation,
            installationAccounts: [
              {
                accountLogin: "acme",
                installationId: 123,
                repositorySelection: "selected",
              },
            ],
            installationId: "123",
            installationStatusCopy: "GitHub App is linked.",
            installUrl: "https://github.com/apps/alphaci/installations/new",
            linkedRepos: [
              { repoFullName: "acme/api" },
              { repoFullName: "acme/web" },
              { repoFullName: "acme/admin" },
              { repoFullName: "acme/worker" },
            ],
            linkingInstallation: false,
            loadingInstallUrl: false,
            setInstallationId,
          }}
        />,
      );
    });

    expect(container.textContent).toContain("GitHub App");
    expect(container.textContent).toContain("GitHub App is linked.");
    expect(container.textContent).toContain("@acme");
    expect(container.textContent).toContain("selected repos");
    expect(container.textContent).toContain("acme/api, acme/web, acme/admin +1 more");
    expect(container.querySelector('a[href="https://github.com/apps/alphaci/installations/new"]')).not.toBeNull();

    const input = container.querySelector<HTMLInputElement>("#installation-id")!;
    changeValue(input, "abc456");
    expect(setInstallationId).toHaveBeenCalledWith("456");

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent === "Link installation",
    ) as HTMLButtonElement;
    act(() => {
      button.click();
    });
    expect(handleLinkInstallation).toHaveBeenCalled();
  });

  it("renders a disabled install button while the install URL is unavailable", () => {
    act(() => {
      root.render(
        <WorkflowSetupGithubPanel
          github={{
            handleLinkInstallation: jest.fn(),
            installationAccounts: [],
            installationId: "",
            installationStatusCopy: "Install the GitHub App first.",
            installUrl: null,
            linkedRepos: [],
            linkingInstallation: false,
            loadingInstallUrl: true,
            setInstallationId: jest.fn(),
          }}
        />,
      );
    });

    expect(container.textContent).toContain("Loading install link…");
    expect(container.querySelector<HTMLButtonElement>("button[disabled]")).not.toBeNull();
  });
});
