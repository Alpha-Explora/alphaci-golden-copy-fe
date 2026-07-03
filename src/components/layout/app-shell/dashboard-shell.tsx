import type { CSSProperties, ReactNode } from "react";

import styles from "./dashboard-shell.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
      className={cx(styles.shell, className)}
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
    <div id={id} className={cx(styles.content, className)} style={style}>
      {children}
    </div>
  );
}
