import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SettingsConnectionsSection } from "../../src/features/dashboard/settings/settings-connections-section";

function renderConnectionsSection() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SettingsConnectionsSection
        initialMethods={[
          { provider: "github", email: "tone@example.test", emailVerified: true },
        ]}
      />,
    );
  });

  return { container, root };
}

describe("settings connected sign-in methods", () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("separates GitHub sign-in from repository access", () => {
    const rendered = renderConnectionsSection();
    root = rendered.root;

    expect(rendered.container).toHaveTextContent("Connected sign-in methods");
    expect(rendered.container).toHaveTextContent("GitHub sign-in is connected.");
    expect(rendered.container).toHaveTextContent(
      "Repository access is managed separately.",
    );
    expect(rendered.container).toHaveTextContent("GitHub App connected");
    expect(rendered.container).toHaveTextContent("tone@example.test");
  });
});
