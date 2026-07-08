"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PackageIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppNav } from "@/components/layout/app-nav";
import { DashboardPageContent, DashboardShell } from "@/components/layout/app-shell/dashboard-shell";
import { SetupFlowSurface } from "@/components/layout/app-shell/setup-flow-surface";
import { PipelineLoader } from "@/components/layout/pipeline-loader";
import { WorkspaceProvider } from "@/components/layout/workspace-context";
import { Badge } from "@/components/ui/badge";
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
import { getGithubAppInstallUrl } from "@/lib/api/client";
import type { SubscriptionInfo } from "@/lib/api/contracts";
import { isGuest } from "@/lib/auth/subscription";
import { cn } from "@/lib/utils";

type OnboardingStep = "connect-github" | "authorize-github" | "select-repository" | "create-application";

type Repository = {
  name: string;
  updated: string;
};

const repositories: Repository[] = [
  { name: "eve-slack-agent", updated: "8 days ago" },
  { name: "cedar-repository", updated: "14 days ago" },
  { name: "cedar-repository-be", updated: "14 days ago" },
  { name: "agents", updated: "20 days ago" },
  { name: "testbackend", updated: "20 days ago" },
  { name: "test-tribe", updated: "2 months ago" },
  { name: "prism-2", updated: "2 months ago" },
  { name: "Brain", updated: "3 months ago" },
  { name: "CEDAR", updated: "3 months ago" },
  { name: "the-study-nook", updated: "4 months ago" },
];

function formatPesoAmount(amount: number) {
  return `\u20B1${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(amount)}`;
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
        Step 2 of 4 - Connect your source control provider
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

function AuthorizeGitHubStep({ creditLine, onFinish }: Readonly<{ creditLine: string; onFinish: () => void }>) {
  return (
    <section className="flex flex-col gap-4" data-onboarding-step="authorize-github">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow
        copy="Finish your GitHub installation by giving AlphaCI permission to access your repositories."
        trail={false}
      >
        Step 2 of 4 - Authorize GitHub access
      </TimelineRow>
      <Card className="ml-9 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 p-4 max-sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground" aria-hidden="true">
          <GithubIcon />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <strong className="text-sm text-foreground">GitHub</strong>
          <span className="text-sm text-muted-foreground">Authorized as</span>
          <Badge tone="accent">antoneeeems</Badge>
        </div>
        <Button data-action="finish-github-setup" size="sm" onClick={onFinish}>Finish setup</Button>
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

function RepositorySelectionStep({ creditLine, onSelect }: Readonly<{ creditLine: string; onSelect: (repository: Repository) => void }>) {
  return (
    <section className="flex flex-col gap-4" data-onboarding-step="select-repository">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow complete>Step 2 of 4 - Connect your source control provider</TimelineRow>
      <TimelineRow copy="Select a repository or use a template to get started." trail={false}>
        Step 3 of 4 - Select a repository
      </TimelineRow>
      <div className="ml-9 flex flex-col gap-4">
        <div className="flex items-end gap-6">
          <button className="min-h-8 border-0 border-b-2 border-foreground bg-transparent pb-3 text-sm font-bold text-foreground" type="button">Import a repository</button>
          <button className="min-h-8 border-0 border-b-2 border-transparent bg-transparent pb-3 text-sm font-bold text-muted-foreground" type="button">Use a template</button>
        </div>
        <Separator />
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
      </div>
    </section>
  );
}

function CreateApplicationStep({ creditLine, repository }: Readonly<{ creditLine: string; repository: Repository }>) {
  return (
    <section className="flex flex-col gap-4" data-onboarding-step="create-application">
      <TimelineRow complete>{creditLine}</TimelineRow>
      <TimelineRow complete>Step 2 of 4 - Connect your source control provider</TimelineRow>
      <TimelineRow complete>Step 3 of 4 - Select a repository</TimelineRow>
      <TimelineRow
        copy="Pick a name for your application and the region closest to your users."
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
            <strong className="text-sm text-foreground">{repository.name}</strong>
            <span className="text-sm text-muted-foreground">Cloning from antoneeeems/{repository.name}</span>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-bold text-foreground">Git provider account</span>
            <AccountSelect />
          </label>
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-bold text-foreground">Application name</span>
            <input className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-0" defaultValue={repository.name} />
          </label>
        </div>
        <p className="m-0 ml-[calc(13rem+1rem)] text-sm text-muted-foreground max-sm:ml-0">Your repo name is {repository.name}. Change</p>
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-bold text-foreground">Region</span>
          <button className="inline-flex min-h-10 w-full items-center justify-start gap-3 rounded-lg border border-border bg-background px-3 text-sm text-foreground" type="button">
            <MapPinIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-left">US East (Ohio)</span>
            <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </label>
        <Button className="mt-2 w-full">Create application</Button>
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
  selectedRepository,
}: Readonly<{
  currentStep: OnboardingStep;
  onConnect: () => void;
  installUrl: string | null;
  loadingInstallUrl: boolean;
  onFinishGitHub: () => void;
  onSelectRepository: (repository: Repository) => void;
  creditLine: string;
  selectedRepository: Repository;
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
    return <AuthorizeGitHubStep creditLine={creditLine} onFinish={onFinishGitHub} />;
  }

  if (currentStep === "select-repository") {
    return <RepositorySelectionStep creditLine={creditLine} onSelect={onSelectRepository} />;
  }

  return <CreateApplicationStep creditLine={creditLine} repository={selectedRepository} />;
}

function OnboardingContent() {
  const router = useRouter();
  const { session, status, refresh } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("connect-github");
  const [selectedRepository, setSelectedRepository] = useState<Repository>(repositories[0]);
  const [githubInstallUrl, setGithubInstallUrl] = useState<string | null>(null);
  const [loadingGithubInstallUrl, setLoadingGithubInstallUrl] = useState(true);

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/signup");
    }
  }, [router, status]);

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
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener,noreferrer`,
    );
    setCurrentStep("authorize-github");
  }

  function handleSelectRepository(repository: Repository) {
    setSelectedRepository(repository);
    setCurrentStep("create-application");
  }

  if (status === "loading") {
    return <PipelineLoader label="Loading onboarding" />;
  }

  if (status === "signed-out") {
    return <PipelineLoader label="Redirecting to sign up" />;
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
              onFinishGitHub={() => setCurrentStep("select-repository")}
              onSelectRepository={handleSelectRepository}
              creditLine={creditLine}
              selectedRepository={selectedRepository}
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
