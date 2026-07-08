import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  suppressHydrationWarning?: boolean;
}

interface DashboardPageContentProps {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export function DashboardShell({
  children,
  className,
  style,
  suppressHydrationWarning = true,
}: Readonly<DashboardShellProps>) {
  return (
    <main
      className={cn("relative min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]", className)}
      style={style}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </main>
  );
}

export function DashboardPageContent({
  children,
  className,
  id = "main-content",
  style,
}: Readonly<DashboardPageContentProps>) {
  return (
    <div
      id={id}
      className={cn(
        "relative z-[1] mx-auto grid min-h-screen w-[min(100%,1480px)] gap-6 pb-[3.25rem] pl-[calc(var(--sidebar-width)_+_var(--layout-gutter))] pr-[var(--layout-gutter)] pt-[calc(var(--app-header-height,44px)_+_1.5rem)] max-[768px]:pl-[calc(64px_+_var(--layout-gutter))] max-[640px]:gap-5 max-[640px]:pl-[calc(64px_+_1rem)] max-[640px]:pr-4",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
