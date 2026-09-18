"use client";

import type { ReactNode } from "react";

import { EduLabSwitcher } from "@/features/auth/edu-labs";
import { EduAuthShell } from "@/features/auth/edu-signin";

import { githubConnectionCopy } from "../model/edu-connect-github-rules";
import { useEduConnectGithubViewModel } from "../view-models/use-edu-connect-github-view-model";

function GithubGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.77.5 12.27c0 5.2 3.3 9.6 7.88 11.15.58.11.79-.26.79-.57 0-.28-.01-1.2-.02-2.18-3.2.71-3.88-1.39-3.88-1.39-.53-1.37-1.29-1.73-1.29-1.73-1.05-.74.08-.73.08-.73 1.17.08 1.78 1.22 1.78 1.22 1.03 1.81 2.71 1.29 3.37.98.1-.77.4-1.29.72-1.58-2.56-.3-5.26-1.3-5.26-5.8 0-1.28.45-2.33 1.18-3.16-.12-.3-.51-1.53.11-3.19 0 0 .97-.32 3.18 1.2a10.8 10.8 0 0 1 5.8 0c2.2-1.52 3.17-1.2 3.17-1.2.63 1.66.24 2.9.12 3.19.73.83 1.17 1.88 1.17 3.16 0 4.51-2.71 5.49-5.3 5.78.41.37.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.21 0 .31.21.69.8.57a11.83 11.83 0 0 0 7.87-11.15C23.5 5.77 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function StatusPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="auth-self-serve-form">{children}</div>;
}

type EduConnectGithubViewModel = ReturnType<typeof useEduConnectGithubViewModel>;
type GithubConnectionCopy = ReturnType<typeof githubConnectionCopy>;

function GithubConnectionDetails({
  copy,
  vm,
}: Readonly<{ copy: GithubConnectionCopy; vm: EduConnectGithubViewModel }>) {
  return (
    <>
      <h1>{copy.title}</h1>
      <p className="auth-subtitle">
        {vm.github.linked
          ? `Your EDU account is linked as ${vm.github.login ?? "a GitHub account"}.`
          : `You are signed in as ${vm.user?.name ?? vm.user?.email ?? "EDU staff"}.`}
      </p>

      {vm.github.linked ? (
        <p className="helper-text auth-self-serve-message">{copy.description}</p>
      ) : (
        <ol className="auth-self-serve-form">
          <li>GitHub confirms the account you choose.</li>
          <li>The EDU service records the link without changing your password provider.</li>
          <li>You can skip for now and keep the access already assigned to your profile.</li>
        </ol>
      )}
    </>
  );
}

function GithubConnectionActions({ vm }: Readonly<{ vm: EduConnectGithubViewModel }>) {
  return (
    <>
      <div className="auth-self-serve-form">
        <button className="primary-button auth-self-serve-submit" onClick={vm.connect} type="button">
          <span aria-hidden="true" style={{ display: "inline-flex", width: 18, height: 18 }}>
            <GithubGlyph />
          </span>
          {vm.github.linked ? "Reconnect GitHub" : "Connect GitHub"}
        </button>
        <button className="ghost-button" onClick={vm.skip} type="button">
          Skip for now
        </button>
      </div>

      <EduLabSwitcher
        labs={vm.labs}
        onSelect={vm.selectLab}
        selectedLabId={vm.selectedLabId}
        status={vm.status}
      />
    </>
  );
}

function EduConnectGithubBody({
  copy,
  vm,
}: Readonly<{ copy: GithubConnectionCopy; vm: EduConnectGithubViewModel }>) {
  if (vm.isResolving) {
    return (
      <StatusPanel>
        <p className="helper-text" role="status">
          Checking your EDU session…
        </p>
      </StatusPanel>
    );
  }

  if (vm.error) {
    return (
      <StatusPanel>
        <p className="error-text" role="alert">
          {vm.error}
        </p>
      </StatusPanel>
    );
  }

  return (
    <>
      <GithubConnectionDetails copy={copy} vm={vm} />
      <GithubConnectionActions vm={vm} />
    </>
  );
}

export function EduConnectGithubView() {
  const vm = useEduConnectGithubViewModel();
  const copy = githubConnectionCopy(vm.github.linked);

  return (
    <EduAuthShell
      copy="Students never need a GitHub identity. Staff can connect one after signing in so the server can evaluate staff access separately from the EDU password."
      eyebrow="Staff account linking"
      title="Keep the staff door deliberate."
    >
      <EduConnectGithubBody copy={copy} vm={vm} />
    </EduAuthShell>
  );
}
