import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { AuthCallbackClient } from "../../src/app/auth/callback/callback-client";
import { getAuthSession } from "../../src/lib/api/client";

let searchParamsValue = "";
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

jest.mock("framer-motion", () => {
  const React = jest.requireActual("react") as typeof import("react");
  const motion = new Proxy(
    {},
    {
      get(_target, tag) {
        return function MotionMock({
          children,
          ...props
        }: {
          children?: React.ReactNode;
        } & Record<string, unknown>) {
          const domProps = Object.fromEntries(
            Object.entries(props).filter(
              ([key]) =>
                ![
                  "initial",
                  "animate",
                  "exit",
                  "transition",
                  "variants",
                ].includes(key),
            ),
          );
          return React.createElement(String(tag), domProps, children);
        };
      },
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion,
    useReducedMotion: () => true,
  };
});

jest.mock("../../src/components/layout/flow-background", () => ({
  FlowBackground: () => <div data-testid="flow-background" />,
}));

jest.mock("../../src/components/layout/pipeline-loader", () => ({
  PipelineLoader: ({ label }: { label: string }) => (
    <div data-testid="pipeline-loader">{label}</div>
  ),
}));

jest.mock("../../src/lib/api/client", () => {
  const actual = jest.requireActual("../../src/lib/api/client");
  return {
    ...actual,
    createGitHubLoginUrl: (returnTo: string) =>
      `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`,
    getAuthSession: jest.fn(),
    getPendingAccount: jest.fn(),
    restoreAccount: jest.fn(),
    startFreshAccount: jest.fn(),
  };
});

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<
  typeof getAuthSession
>;

function renderCallback() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<AuthCallbackClient />);
  });
  return { container, root };
}

describe("AuthCallbackClient", () => {
  let root: Root | null = null;

  beforeEach(() => {
    searchParamsValue = "";
    replaceMock.mockClear();
    mockedGetAuthSession.mockReset();
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    root = null;
    document.body.innerHTML = "";
  });

  it("renders a specific message when GitHub cannot provide a verified email", () => {
    searchParamsValue = "auth=email_required&provider=github&intent=signup";

    const result = renderCallback();
    root = result.root;

    expect(result.container).toHaveTextContent("Authentication needs retry");
    expect(result.container).toHaveTextContent(
      "GitHub did not provide a verified email address. Make sure your GitHub account has a verified primary email, then retry sign in.",
    );
    expect(mockedGetAuthSession).not.toHaveBeenCalled();
  });
});
