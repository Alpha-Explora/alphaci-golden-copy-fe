"use client";

import Link from "next/link";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CircleHelpIcon,
  FileTextIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  UserRoundIcon,
} from "lucide-react";

import { PipelineLogo } from "@/components/layout/pipeline-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useAuthSession } from "@/hooks/use-auth-session";
import type { ProvisionedProject, WorkspacesMeResponse, WorkspaceSummary } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  guest: boolean;
  session: ReturnType<typeof useAuthSession>["session"];
  workspaces: WorkspacesMeResponse | null;
  projects: ProvisionedProject[];
  selectedProject: ProvisionedProject | null;
  onLogout: () => void;
  isLoggingOut: boolean;
}

function initials(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "A";
}

function projectName(project: ProvisionedProject) {
  return project.repoFullName.split("/")[1] ?? project.repoFullName;
}

function workspaceName(workspace: WorkspaceSummary, fallbackName: string) {
  if (workspace.kind === "personal" && workspace.name.trim().toLowerCase() === "personal workspace") {
    return fallbackName;
  }
  return workspace.name;
}

function HeaderMark({ children, className }: Readonly<{ children: string; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border bg-secondary text-[10px] font-medium leading-none text-secondary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function HeaderTrigger({
  children,
  className,
  "aria-label": ariaLabel,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  "aria-label": string;
}>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 min-w-0 items-center gap-2 rounded-md border border-transparent px-2 text-sm font-normal text-muted-foreground outline-none transition-colors hover:border-border hover:bg-secondary hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:border-border data-[state=open]:bg-secondary data-[state=open]:text-foreground",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function OrgSwitcher({
  currentWorkspace,
  displayName,
  workspaces,
}: Readonly<{ currentWorkspace: WorkspaceSummary; displayName: string; workspaces: WorkspaceSummary[] }>) {
  const currentName = workspaceName(currentWorkspace, displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderTrigger aria-label="Switch workspace">
          <HeaderMark className="text-primary">{initials(currentName)}</HeaderMark>
          <span className="max-w-44 truncate text-foreground">{currentName}</span>
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </HeaderTrigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 rounded-md border-border bg-popover p-1 text-popover-foreground" align="start" sideOffset={8}>
        <DropdownMenuGroup>
          {workspaces.map((workspace) => {
            const name = workspaceName(workspace, displayName);
            return (
              <DropdownMenuItem key={workspace.id} className="h-8 gap-2 text-sm">
                <HeaderMark className="text-primary">{initials(name)}</HeaderMark>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {workspace.id === currentWorkspace.id ? <CheckIcon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="h-8 gap-2 text-sm text-primary">
            <PlusIcon className="size-4" aria-hidden="true" />
            New organization
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectSwitcher({
  projects,
  selectedProject,
}: Readonly<{ projects: ProvisionedProject[]; selectedProject: ProvisionedProject | null }>) {
  const currentProject = selectedProject ?? projects[0];
  if (!currentProject) return null;

  const selectedName = projectName(currentProject);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderTrigger aria-label="Switch project" className="hidden md:inline-flex">
          <HeaderMark className="text-primary">{initials(selectedName)}</HeaderMark>
          <span className="max-w-52 truncate text-foreground">{selectedName}</span>
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </HeaderTrigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-md border-border bg-popover p-1 text-popover-foreground" align="start" sideOffset={8}>
        <DropdownMenuGroup>
          {projects.map((project) => {
            const name = projectName(project);
            const isSelected = currentProject.id === project.id;
            return (
              <DropdownMenuItem key={project.id} className="h-9 gap-2 text-sm">
                <HeaderMark className="text-primary">{initials(name)}</HeaderMark>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {isSelected ? <CheckIcon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="h-8 gap-2 text-sm text-primary">
            <Link href="/workflows">
              <PlusIcon className="size-4" aria-hidden="true" />
              New application
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchButton() {
  return (
    <button
      type="button"
      className="hidden h-8 min-w-48 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-normal text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 lg:inline-flex"
      aria-label="Search"
    >
      <SearchIcon className="size-4" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-left">Search</span>
      <span className="text-xs text-muted-foreground">Ctrl+K</span>
    </button>
  );
}

function AccountMenu({
  session,
  onLogout,
  isLoggingOut,
}: Readonly<Pick<AppHeaderProps, "session" | "onLogout" | "isLoggingOut">>) {
  const displayName = session?.user.name ?? session?.user.login ?? "User";
  const email = session?.user.email ?? session?.user.login ?? "user";
  const initial = initials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:border-ring"
          aria-label="Open account menu"
        >
          <Avatar size="sm" className="size-7">
            {session?.user.avatarUrl ? <AvatarImage src={session.user.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-md border-border bg-popover p-0 text-popover-foreground" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 p-3">
          <Avatar className="size-9">
            {session?.user.avatarUrl ? <AvatarImage src={session.user.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="h-9 gap-2 text-sm">
            <Link href="/settings">
              <UserRoundIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-9 gap-2 text-sm">
            <Link href="/guide">
              <FileTextIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              Docs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-9 gap-2 text-sm">
            <Link href="/guide">
              <CircleHelpIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              Help
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="h-9 gap-2 text-sm" onSelect={onLogout} disabled={isLoggingOut}>
            <LogOutIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader({
  guest,
  session,
  workspaces,
  projects,
  selectedProject,
  onLogout,
  isLoggingOut,
}: Readonly<AppHeaderProps>) {
  const displayName = session?.user.name ?? session?.user.login ?? "User";
  const fallbackWorkspace: WorkspaceSummary = {
    id: "personal",
    name: displayName,
    kind: "personal",
    role: "owner",
  };
  const workspaceItems = workspaces?.items.length ? workspaces.items : [fallbackWorkspace];
  const currentWorkspace = workspaceItems[0] ?? fallbackWorkspace;
  const hasProjects = projects.length > 0;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-[var(--app-header-height,44px)] items-center justify-between border-b border-border bg-background px-3 text-foreground"
      data-app-header="true"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/home" className="inline-flex size-7 shrink-0 items-center justify-center text-foreground" aria-label="AlphaCI home">
          <PipelineLogo size={18} />
        </Link>
        {!guest ? <OrgSwitcher currentWorkspace={currentWorkspace} displayName={displayName} workspaces={workspaceItems} /> : null}
        {!guest && hasProjects ? <ProjectSwitcher projects={projects} selectedProject={selectedProject} /> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!guest ? <SearchButton /> : null}
        {!guest ? <AccountMenu session={session} onLogout={onLogout} isLoggingOut={isLoggingOut} /> : null}
        {guest ? (
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground" href="/signup">
            Sign up
          </Link>
        ) : null}
      </div>
    </header>
  );
}