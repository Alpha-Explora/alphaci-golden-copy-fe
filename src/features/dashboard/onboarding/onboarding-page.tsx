"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  PackageIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppNav } from "@/components/layout/app-nav";
import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { SetupFlowSurface } from "@/components/layout/app-shell/setup-flow-surface";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { GithubIcon } from "@/features/dashboard/settings/settings-icons";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/api/auth";
import { getGithubAppInstallUrl, linkGithubInstallation } from "@/lib/api/client";
import { createProject } from "@/lib/api/projects";
import type { SubscriptionInfo } from "@/lib/api/contracts";
import { getRouteAccessRedirect, isGuest } from "@/lib/auth/subscription";
import { cn } from "@/lib/utils";

type OnboardingStep = "connect-github" | "authorize-github" | "select-repository" | "create-application";

type StarterKitIcon = "react" | "nextjs" | "nodejs" | "nestjs";
type RepositorySelectionTab = "import" | "template";
type StarterKitPlan = "solo" | "plus" | "pro";

type Repository = {
  name: string;
  updated: string;
  source: "repository" | "template";
  title?: string;
  description?: string;
  icon?: StarterKitIcon;
  projectTypeId?: string;
  defaultRecipesByPlan?: Record<StarterKitPlan, string>;
};
type GitHubInstallationState = {
  accountLogin: string;
  installationId: number | null;
  linking: boolean;
};

type GitHubInstallationMessage = {
  type: "alphaci:github-installation";
  installationId: number;
  setupAction?: string | null;
};

const repositories: Repository[] = [
  { name: "eve-slack-agent", updated: "8 days ago", source: "repository" },
  { name: "cedar-repository", updated: "14 days ago", source: "repository" },
  { name: "cedar-repository-be", updated: "14 days ago", source: "repository" },
  { name: "agents", updated: "20 days ago", source: "repository" },
  { name: "testbackend", updated: "20 days ago", source: "repository" },
  { name: "test-tribe", updated: "2 months ago", source: "repository" },
  { name: "prism-2", updated: "2 months ago", source: "repository" },
  { name: "Brain", updated: "3 months ago", source: "repository" },
  { name: "CEDAR", updated: "3 months ago", source: "repository" },
  { name: "the-study-nook", updated: "4 months ago", source: "repository" },
];

const applicationTemplates: Repository[] = [
  {
    name: "react-starter-kit",
    title: "React Starter Kit",
    updated: "React, TypeScript, shadcn/ui",
    description: "React, TypeScript, shadcn/ui",
    icon: "react",
    projectTypeId: "react-spa",
    defaultRecipesByPlan: {
      solo: "frontend-checks",
      plus: "frontend-code-quality",
      pro: "frontend-release",
    },
    source: "template",
  },
  {
    name: "nextjs-starter-kit",
    title: "Next.js Starter Kit",
    updated: "Next.js, TypeScript, App Router",
    description: "Next.js, TypeScript, App Router",
    icon: "nextjs",
    projectTypeId: "nextjs-app",
    defaultRecipesByPlan: {
      solo: "frontend-checks",
      plus: "frontend-code-quality",
      pro: "frontend-release",
    },
    source: "template",
  },
  {
    name: "nodejs-starter-kit",
    title: "Node.js Starter Kit",
    updated: "Node.js, TypeScript, API service",
    description: "Node.js, TypeScript, API service",
    icon: "nodejs",
    projectTypeId: "nodejs-api",
    defaultRecipesByPlan: {
      solo: "backend-checks",
      plus: "backend-code-quality",
      pro: "backend-release",
    },
    source: "template",
  },
  {
    name: "nestjs-starter-kit",
    title: "NestJS Starter Kit",
    updated: "NestJS, TypeScript, REST API",
    description: "NestJS, TypeScript, REST API",
    icon: "nestjs",
    projectTypeId: "nestjs-api",
    defaultRecipesByPlan: {
      solo: "backend-checks",
      plus: "backend-code-quality",
      pro: "backend-release",
    },
    source: "template",
  },
];

function isRepositoryImportEnabled() {
  return process.env.NEXT_PUBLIC_ONBOARDING_REPOSITORY_IMPORT_ENABLED === "true";
}

function formatPesoAmount(amount: number) {
  return `\u20B1${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(amount)}`;
}

function getOnboardingSignupRedirectHref() {
  const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}` || "/onboarding";
  const params = new URLSearchParams({ next: nextPath });
  return `/signup?${params.toString()}`;
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isTrustedGitHubInstallationOrigin(origin: string) {
  try {
    const source = new URL(origin);
    const current = new URL(window.location.origin);
    if (source.origin === current.origin) {
      return true;
    }

    return source.protocol === current.protocol && source.port === current.port && isLoopbackHost(source.hostname) && isLoopbackHost(current.hostname);
  } catch {
    return false;
  }
}

function getGitHubInstallationTargetOrigins(currentOrigin: string) {
  const origins = new Set([currentOrigin]);
  try {
    const current = new URL(currentOrigin);
    if (isLoopbackHost(current.hostname)) {
      current.hostname = current.hostname === "localhost" ? "127.0.0.1" : "localhost";
      origins.add(current.origin);
    }
  } catch {
    // Keep the current origin only.
  }

  return Array.from(origins);
}

function notifyGitHubInstallationOpener(message: GitHubInstallationMessage) {
  if (!window.opener) {
    return;
  }

  for (const origin of getGitHubInstallationTargetOrigins(window.location.origin)) {
    window.opener.postMessage(message, origin);
  }

  window.setTimeout(() => window.close(), 300);
}

function isGitHubInstallationMessage(data: unknown): data is GitHubInstallationMessage {
  if (!data || typeof data !== "object") {
    return false;
  }

  const message = data as Partial<GitHubInstallationMessage>;
  return message.type === "alphaci:github-installation" && Number.isInteger(message.installationId) && Number(message.installationId) > 0;
}

function getPlanCreditLine(subscription: SubscriptionInfo | null | undefined) {
  const planCode = subscription?.planCode ?? subscription?.plan;
  const planLabel =
    planCode === "growth"
      ? "Growth"
      : planCode === "business"
        ? "Business"
        : "Starter";
  const amount = typeof subscription?.amountPhp === "number"
    ? formatPesoAmount(subscription.amountPhp)
    : subscription?.status === "active"
      ? "\u20B1300"
      : null;

  if (amount) {
    return `${planLabel} plan credit - ${amount} AlphaCI credits are ready for this workspace.`;
  }

  return `${planLabel} plan credits are ready for this workspace.`;
}
function getStarterKitPlan(subscription: SubscriptionInfo | null | undefined): StarterKitPlan {
  const planCode = subscription?.planCode ?? subscription?.plan;
  if (planCode === "pro" || planCode === "plus") {
    return planCode;
  }

  return "solo";
}

function getStarterKitRepoName(repository: Repository) {
  return repository.name.replace(/-starter-kit$/, "") || repository.name;
}

function StepMarker({ complete = false }: Readonly<{ complete?: boolean }>) {
  return (
    <span
      className={cn(
        "relative z-10 mt-px inline-flex size-5 items-center justify-center rounded-full",
        complete
          ? "border-2 border-background bg-emerald-400 text-background shadow-[0_0_0_1px_var(--success)]"
          : "border border-border bg-background",
      )}
      aria-hidden="true"
    >
      {complete ? <CheckIcon className="size-3 stroke-[3]" /> : null}
    </span>
  );
}

function TimelineRow({
  children,
  complete = false,
  copy,
  trail = true,
}: Readonly<{
  children: React.ReactNode;
  complete?: boolean;
  copy?: string;
  trail?: boolean;
}>) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-4",
        trail
          ? "before:absolute before:bottom-[-1.05rem] before:left-[0.6rem] before:top-[1.45rem] before:w-px before:bg-border"
          : "",
      )}
    >
      <StepMarker complete={complete} />
      <div className="flex min-w-0 flex-col gap-3">
        <p className={complete ? "m-0 pt-px text-sm leading-6 text-muted-foreground" : "m-0 text-sm font-bold leading-6 text-foreground"}>
          {children}
        </p>
        {copy ? <p className="m-0 text-sm leading-6 text-muted-foreground">{copy}</p> : null}
      </div>
    </div>
  );
}

function StepLabel({ step, children }: Readonly<{ step: string; children: React.ReactNode }>) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <span className="font-normal text-muted-foreground">{step}</span>
      <span className="font-normal text-muted-foreground" aria-hidden="true">·</span>
      <span className="font-semibold text-foreground">{children}</span>
    </span>
  );
}

function FlowHeader() {
  return (
    <div className="ml-9 flex flex-col gap-2">
      <h1 className="m-0 text-xl font-bold leading-tight text-foreground">Ship your first application</h1>
      <p className="m-0 text-sm leading-6 text-muted-foreground">Get your application up and running in a few easy steps.</p>
    </div>
  );
}

function AccountSelect() {
  return (
    <button
      className="inline-flex min-h-10 w-full items-center justify-start gap-3 rounded-lg border border-border bg-background px-3 text-left text-sm text-foreground"
      type="button"
    >
      <GithubIcon />
      <span className="min-w-0 flex-1 truncate">antoneeeems</span>
      <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function ConnectGitHubStep({
  creditLine,
  installUrl,
  loadingInstallUrl,
  onConnect,
}: Readonly<{
  creditLine: string;
  installUrl: string | null;
  loadingInstallUrl: boolean;
  onConnect: () => void;
}>) {
  return (
    <section className="flex flex-col gap-4" data-onboarding-step="connect-github">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow
        copy="Connect your Git provider to deploy an existing repository or start from a template."
        trail={false}
      >
        <StepLabel step="Step 2 of 4">Connect your source control provider</StepLabel>
      </TimelineRow>
      <div className="ml-9 flex flex-col gap-3">
        <Button
          data-action="connect-github"
          size="lg"
          className="w-full"
          leadingIcon={<GithubIcon />}
          onClick={onConnect}
          disabled={!installUrl || loadingInstallUrl}
        >
          {loadingInstallUrl ? "Loading GitHub App install link..." : "Connect GitHub account"}
        </Button>
        {!installUrl && !loadingInstallUrl ? (
          <p className="m-0 text-sm leading-6 text-destructive">GitHub App install link unavailable. Try again in a moment.</p>
        ) : null}
        <p className="m-0 text-sm leading-6 text-muted-foreground">
          Don&apos;t have a GitHub account? Try <a className="font-bold text-primary hover:text-foreground" href="https://gitlab.com">GitLab</a> or{" "}
          <a className="font-bold text-primary hover:text-foreground" href="https://bitbucket.org">Bitbucket</a>
        </p>
      </div>
    </section>
  );
}

function AuthorizeGitHubStep({
  creditLine,
  githubInstallation,
  onFinish,
}: Readonly<{
  creditLine: string;
  githubInstallation: GitHubInstallationState;
  onFinish: () => void;
}>) {
  return (
    <section className="flex flex-col gap-4" data-onboarding-step="authorize-github">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow
        copy="Finish your GitHub installation by giving AlphaCI permission to access your repositories."
        trail={false}
      >
        <StepLabel step="Step 2 of 4">Authorize GitHub access</StepLabel>
      </TimelineRow>
      <Card className="ml-9 grid min-h-[4.5rem] grid-cols-[2.25rem_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 max-sm:grid-cols-[2.25rem_minmax(0,1fr)]">
        <div className="flex size-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground" aria-hidden="true">
          <GithubIcon />
        </div>
        <div className="grid min-w-0 gap-0.5">
          <strong className="text-sm leading-5 text-foreground">GitHub</strong>
          <span className="text-sm leading-5 text-muted-foreground">Authorized as</span>
          <span className="inline-flex max-w-fit items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-bold leading-4 text-muted-foreground">
            <span className="inline-flex size-3 items-center justify-center rounded-sm border border-primary/40 text-[0.58rem] leading-none text-primary" aria-hidden="true">
              A
            </span>
            <span className="truncate">{githubInstallation.accountLogin}</span>
          </span>
        </div>
        <Button data-action="finish-github-setup" size="sm" onClick={onFinish} loading={githubInstallation.linking}>
          {githubInstallation.linking ? "Finishing..." : "Finish setup"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-8 items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="GitHub installation options"
            type="button"
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem>View installation</DropdownMenuItem>
              <DropdownMenuItem>Switch account</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </section>
  );
}
function ReactLogo() {
  return (
    <svg
      className="size-4"
      data-template-logo="react"
      viewBox="-11.5 -10.23174 23 20.46348"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="0" cy="0" r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function NextjsLogo() {
  return (
    <svg className="size-4" data-template-logo="nextjs" viewBox="0 0 180 180" aria-hidden="true">
      <circle cx="90" cy="90" r="82" fill="currentColor" />
      <path
        d="M55 54h19.5l50.8 76.8V54H144v72.3a82.6 82.6 0 0 1-14.1 13.7L73.9 54H55Zm0 72V75.2l18.8 28.5V126H55Z"
        fill="var(--background)"
      />
    </svg>
  );
}

function NodejsLogo() {
  return (
    <svg className="size-4" data-template-logo="nodejs" viewBox="0 0 256 288" aria-hidden="true">
      <path fill="currentColor" d="M128 0 24 60v120l104 60 104-60V60L128 0Zm0 23 84 48.5v97L128 217 44 168.5v-97L128 23Z" />
      <path fill="currentColor" d="M83 91h25l40 64V91h25v106h-25l-40-64v64H83V91Z" />
    </svg>
  );
}

function NestjsLogo() {
  return (
    <svg className="size-4" data-template-logo="nestjs" viewBox="0 0 256 256" aria-hidden="true">
      <path fill="currentColor" d="M128 15 31 70v112l97 59 97-59V70L128 15Zm0 32 69 39v78l-69 42-69-42V86l69-39Z" />
      <path fill="currentColor" d="M73 165V79h29l26 42 26-42h29v86h-27v-43l-19 30h-18l-19-30v43H73Z" />
    </svg>
  );
}

function getStarterKitHoverClassName(icon: StarterKitIcon | undefined) {
  switch (icon) {
    case "react":
      return "hover:border-cyan-400/50 hover:bg-cyan-400/10";
    case "nextjs":
      return "hover:border-neutral-400/50 hover:bg-neutral-400/10";
    case "nodejs":
      return "hover:border-emerald-400/50 hover:bg-emerald-400/10";
    case "nestjs":
      return "hover:border-rose-400/50 hover:bg-rose-400/10";
    default:
      return "hover:bg-muted";
  }
}

function StarterKitLogo({ icon }: Readonly<{ icon: StarterKitIcon }>) {
  const logoClassName = cn(
    "flex size-6 shrink-0 items-center justify-center rounded-md",
    icon === "react" && "bg-cyan-400/10 text-cyan-300",
    icon === "nextjs" && "bg-foreground/10 text-foreground",
    icon === "nodejs" && "bg-emerald-400/10 text-emerald-300",
    icon === "nestjs" && "bg-rose-400/10 text-rose-300",
  );

  return (
    <span className={logoClassName} data-template-icon={icon} aria-hidden="true">
      {icon === "react" ? <ReactLogo /> : null}
      {icon === "nextjs" ? <NextjsLogo /> : null}
      {icon === "nodejs" ? <NodejsLogo /> : null}
      {icon === "nestjs" ? <NestjsLogo /> : null}
    </span>
  );
}
function StarterKitOption({ template, onSelect }: Readonly<{ template: Repository; onSelect: (template: Repository) => void }>) {
  return (
    <button
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 text-left text-sm text-foreground transition-colors",
        getStarterKitHoverClassName(template.icon),
      )}
      data-template={template.name}
      data-starter-kit={template.name}
      onClick={() => onSelect(template)}
      type="button"
    >
      <StarterKitLogo icon={template.icon ?? "react"} />
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <strong className="font-bold text-foreground">{template.title}</strong>
        <span className="text-muted-foreground">- {template.description}</span>
      </span>
    </button>
  );
}

function RepositorySelectionStep({ creditLine, onSelect }: Readonly<{ creditLine: string; onSelect: (repository: Repository) => void }>) {
  const repositoryImportEnabled = isRepositoryImportEnabled();
  const [activeTab, setActiveTab] = useState<RepositorySelectionTab>(repositoryImportEnabled ? "import" : "template");
  const showRepositoryImport = repositoryImportEnabled && activeTab === "import";
  const showTemplates = !repositoryImportEnabled || activeTab === "template";

  return (
    <section className="flex flex-col gap-4" data-onboarding-step="select-repository">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow complete>Step 2 of 4 - Connect your source control provider</TimelineRow>
      <TimelineRow copy={repositoryImportEnabled ? "Select a repository or use a template to get started." : "Start from a template to get your application running."} trail={false}>
        Step 3 of 4 - Select a repository
      </TimelineRow>
      <div className="ml-9 flex flex-col gap-4">
        <div className="flex items-end gap-6">
          {repositoryImportEnabled ? (
            <button
              className={cn(
                "min-h-8 border-0 border-b-2 bg-transparent pb-3 text-sm font-bold",
                activeTab === "import" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
              )}
              data-template-tab="import-repository"
              onClick={() => setActiveTab("import")}
              type="button"
            >
              Import a repository
            </button>
          ) : null}
          <button
            className={cn(
              "min-h-8 border-0 border-b-2 bg-transparent pb-3 text-sm font-bold",
              activeTab === "template" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
            )}
            data-template-tab="use-template"
            onClick={() => setActiveTab("template")}
            type="button"
          >
            Use a template
          </button>
        </div>
        <Separator />
        {showRepositoryImport ? (
          <>
            <div className="grid grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
              <AccountSelect />
              <label className="flex min-h-10 items-center gap-3 rounded-lg border border-border bg-background px-3 text-muted-foreground">
                <SearchIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">Search repositories</span>
                <input className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-0 placeholder:text-muted-foreground" placeholder="Search all repositories" type="search" />
              </label>
            </div>
            <Card className="flex flex-col gap-0 py-2">
              {repositories.map((repository) => (
                <button
                  className="flex min-h-10 items-baseline gap-2 bg-transparent px-4 text-left text-sm text-foreground hover:bg-muted"
                  data-repository={repository.name}
                  key={repository.name}
                  onClick={() => onSelect(repository)}
                  type="button"
                >
                  <strong>{repository.name}</strong>
                  <span className="text-muted-foreground">{repository.updated}</span>
                </button>
              ))}
            </Card>
            <p className="m-0 inline-flex items-center gap-2 text-sm text-emerald-400">
              <StepMarker complete />
              <span>19 repositories fetched</span>
            </p>
          </>
        ) : null}
        {showTemplates ? (
          <div className="flex flex-col gap-3">
            {applicationTemplates.map((template) => (
              <StarterKitOption key={template.name} template={template} onSelect={onSelect} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CreateApplicationStep({
  creditLine,
  creatingProject,
  onCreateApplication,
  repository,
  setupMessage,
}: Readonly<{
  creditLine: string;
  creatingProject: boolean;
  onCreateApplication: () => void;
  repository: Repository;
  setupMessage: string | null;
}>) {
  const [isRepositoryNameEditing, setIsRepositoryNameEditing] = useState(false);
  const sourceCopy = repository.source === "template" ? "Starting from AlphaCI template" : `Cloning from antoneeeems/${repository.name}`;
  const sourceNameCopy = repository.source === "template" ? "Your template name" : "Your repo name";

  return (
    <section className="flex flex-col gap-4" data-onboarding-step="create-application">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow complete>Step 2 of 4 - Connect your source control provider</TimelineRow>
      <TimelineRow complete>Step 3 of 4 - Select a repository</TimelineRow>
      <TimelineRow
        copy="Pick a name for your application."
        trail={false}
      >
        Step 4 of 4 - Create your application
      </TimelineRow>
      <div className="ml-9 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted text-primary" aria-hidden="true">
            <PackageIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <strong className="text-sm text-foreground">{repository.title ?? repository.name}</strong>
            <span className="text-sm text-muted-foreground">{sourceCopy}</span>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-bold text-foreground">Git provider account</span>
            <AccountSelect />
          </label>
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-bold text-foreground">Application name</span>
            <input
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-0"
              data-field="application-name"
              defaultValue={repository.name}
            />
          </label>
        </div>
        {isRepositoryNameEditing ? (
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-bold text-foreground">Repository name</span>
            <input
              autoFocus
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-0"
              data-field="repository-name"
              defaultValue={repository.name}
            />
          </label>
        ) : (
          <p className="m-0 ml-[calc(13rem+1rem)] text-sm text-muted-foreground max-sm:ml-0">
            {sourceNameCopy} is {repository.name}.{" "}
            <button
              className="border-0 bg-transparent p-0 text-sm font-medium text-primary hover:text-foreground"
              data-action="change-repository-name"
              onClick={() => setIsRepositoryNameEditing(true)}
              type="button"
            >
              Change
            </button>
          </p>
        )}
        <Button className="mt-2 w-full" data-action="create-application" loading={creatingProject} onClick={onCreateApplication}>
          {creatingProject ? "Creating application..." : "Create application"}
        </Button>
        {setupMessage ? (
          <p className="m-0 text-sm leading-6 text-muted-foreground">{setupMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
function ActiveStep({
  currentStep,
  onConnect,
  installUrl,
  loadingInstallUrl,
  onFinishGitHub,
  onSelectRepository,
  creditLine,
  githubInstallation,
  selectedRepository,
  creatingProject,
  onCreateApplication,
  setupMessage,
}: Readonly<{
  currentStep: OnboardingStep;
  onConnect: () => void;
  installUrl: string | null;
  loadingInstallUrl: boolean;
  onFinishGitHub: () => void;
  onSelectRepository: (repository: Repository) => void;
  creditLine: string;
  githubInstallation: GitHubInstallationState;
  selectedRepository: Repository;
  creatingProject: boolean;
  onCreateApplication: () => void;
  setupMessage: string | null;
}>) {
  if (currentStep === "connect-github") {
    return (
      <ConnectGitHubStep
        creditLine={creditLine}
        installUrl={installUrl}
        loadingInstallUrl={loadingInstallUrl}
        onConnect={onConnect}
      />
    );
  }

  if (currentStep === "authorize-github") {
    return <AuthorizeGitHubStep creditLine={creditLine} githubInstallation={githubInstallation} onFinish={onFinishGitHub} />;
  }

  if (currentStep === "select-repository") {
    return <RepositorySelectionStep creditLine={creditLine} onSelect={onSelectRepository} />;
  }

  return (
    <CreateApplicationStep
      creditLine={creditLine}
      creatingProject={creatingProject}
      onCreateApplication={onCreateApplication}
      repository={selectedRepository}
      setupMessage={setupMessage}
    />
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { session, status, refresh } = useAuthSession();
  const routeRedirect = getRouteAccessRedirect(session, "/onboarding", "paid");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(session?.githubConnected ? "authorize-github" : "connect-github");
  const [selectedRepository, setSelectedRepository] = useState<Repository>(applicationTemplates[0]);
  const [githubInstallation, setGithubInstallation] = useState<GitHubInstallationState>({
    accountLogin: session?.user.login ?? "GitHub account",
    installationId: null,
    linking: false,
  });
  const [githubInstallUrl, setGithubInstallUrl] = useState<string | null>(null);
  const [loadingGithubInstallUrl, setLoadingGithubInstallUrl] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    if (routeRedirect) {
      router.replace(routeRedirect);
    }
  }, [routeRedirect, router]);

  useEffect(() => {
    if (status !== "signed-in" || !session?.githubConnected) {
      return;
    }

    setCurrentStep((current) => current === "connect-github" ? "authorize-github" : current);
  }, [session?.githubConnected, status]);

  useEffect(() => {
    let active = true;

    async function loadGithubInstallUrl() {
      setLoadingGithubInstallUrl(true);
      try {
        const response = await getGithubAppInstallUrl();
        if (active) {
          setGithubInstallUrl(response.installUrl);
        }
      } catch {
        if (active) {
          setGithubInstallUrl(null);
        }
      } finally {
        if (active) {
          setLoadingGithubInstallUrl(false);
        }
      }
    }

    void loadGithubInstallUrl();

    return () => {
      active = false;
    };
  }, []);

  const completeGitHubInstallation = useCallback(async (installationId: number) => {
    setGithubInstallation({
      accountLogin: session?.user.login ?? "GitHub account",
      installationId,
      linking: true,
    });
    setCurrentStep("authorize-github");

    try {
      await linkGithubInstallation(installationId);
      setCurrentStep("select-repository");
    } finally {
      setGithubInstallation((current) => ({ ...current, linking: false }));
    }
  }, [session?.user.login]);

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const installationId = Number(params.get("installation_id"));
    if (!Number.isInteger(installationId) || installationId < 1) {
      return;
    }

    const message: GitHubInstallationMessage = {
      type: "alphaci:github-installation",
      installationId,
      setupAction: params.get("setup_action") ?? null,
    };

    params.delete("installation_id");
    const remaining = params.toString();
    const cleanUrl = remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);

    void completeGitHubInstallation(installationId).then(() => {
      notifyGitHubInstallationOpener(message);
    });
  }, [completeGitHubInstallation, status]);

  useEffect(() => {
    if (status !== "signed-in") {
      return undefined;
    }

    function handleGitHubInstallationMessage(event: MessageEvent) {
      if (!isTrustedGitHubInstallationOrigin(event.origin) || !isGitHubInstallationMessage(event.data)) {
        return;
      }

      void completeGitHubInstallation(event.data.installationId);
    }

    window.addEventListener("message", handleGitHubInstallationMessage);
    return () => window.removeEventListener("message", handleGitHubInstallationMessage);
  }, [completeGitHubInstallation, status]);

  useEffect(() => {
    if (!session?.user.login) {
      return;
    }

    setGithubInstallation((current) => {
      if (current.accountLogin === session.user.login) {
        return current;
      }

      return {
        ...current,
        accountLogin: session.user.login,
      };
    });
  }, [session?.user.login]);
  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      await refresh();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleConnectGitHub() {
    if (!githubInstallUrl) {
      return;
    }

    const width = 560;
    const height = 720;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    window.open(
      githubInstallUrl,
      "alphaci-github-install",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  }

  async function handleFinishGitHubSetup() {
    if (!githubInstallation.installationId) {
      setCurrentStep("select-repository");
      return;
    }

    await completeGitHubInstallation(githubInstallation.installationId);
  }
  function handleSelectRepository(repository: Repository) {
    setSelectedRepository(repository);
    setSetupMessage(null);
    setCurrentStep("create-application");
  }

  async function handleCreateApplication() {
    if (selectedRepository.source !== "template") {
      setSetupMessage("Select a template before creating an application.");
      return;
    }

    if (!selectedRepository.projectTypeId || !selectedRepository.defaultRecipesByPlan) {
      setSetupMessage("Template setup is not available. Try another template.");
      return;
    }

    const repoName = getStarterKitRepoName(selectedRepository);
    const plan = getStarterKitPlan(session?.subscription);
    setCreatingProject(true);
    setSetupMessage(null);

    try {
      await createProject({
        sourceType: "starter-kit",
        starterKitId: selectedRepository.name,
        repoName,
        visibility: "private",
        repoShape: "single-app",
        projectTypeId: selectedRepository.projectTypeId,
        workflowRecipeId: selectedRepository.defaultRecipesByPlan[plan],
        serviceName: repoName,
        servicePath: ".",
        nodeVersion: "24",
        coverageThreshold: 80,
        tests: {
          lint: true,
          unit: true,
          build: true,
          coverage: true,
          security: true,
          docker: false,
        },
        outputFileName: "ci.yml",
      });
      setSetupMessage("Project created. Checks are ready for the first run.");
    } catch {
      setSetupMessage("Project could not be created. Try again.");
    } finally {
      setCreatingProject(false);
    }
  }

  if (status === "loading") {
    return <PipelineLoader label="Loading onboarding" />;
  }

  if (routeRedirect) {
    return <PipelineLoader label="Checking workspace access" />;
  }

  const guest = isGuest(session);
  const creditLine = getPlanCreditLine(session?.subscription);

  return (
    <DashboardShell>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AppNav
        guest={guest}
        session={session}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
        showSidebar={false}
      />
      <DashboardPageContent
        className="place-items-center"
        id="main-content"
        style={{ padding: "calc(var(--app-header-height, 44px) + 1.5rem) var(--layout-gutter) 3.25rem" }}
      >
        <SetupFlowSurface
          className="min-h-[calc(100dvh-var(--app-header-height,44px)-5rem)] w-full"
          contentClassName="grid min-h-[inherit] w-full place-items-center px-5 py-16 sm:px-8 sm:py-20"
          data-onboarding-page="true"
        >
          <div className="flex w-full max-w-xl flex-col gap-6">
            <FlowHeader />
            <ActiveStep
              currentStep={currentStep}
              onConnect={handleConnectGitHub}
              installUrl={githubInstallUrl}
              loadingInstallUrl={loadingGithubInstallUrl}
              onFinishGitHub={() => void handleFinishGitHubSetup()}
              onSelectRepository={handleSelectRepository}
              creditLine={creditLine}
              githubInstallation={githubInstallation}
              selectedRepository={selectedRepository}
              creatingProject={creatingProject}
              onCreateApplication={() => void handleCreateApplication()}
              setupMessage={setupMessage}
            />
          </div>
        </SetupFlowSurface>
      </DashboardPageContent>
    </DashboardShell>
  );
}

export function OnboardingPage() {
  return (
    <WorkspaceProvider>
      <OnboardingContent />
    </WorkspaceProvider>
  );
}
