import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilePathLabelElement = "code" | "p" | "span";

interface FilePathLabelProps {
  as?: FilePathLabelElement;
  children: ReactNode;
  className?: string;
  surface?: boolean;
}

const baseClasses = "m-0 inline-flex items-center gap-1 font-mono text-[0.72rem] tracking-[0.06em] text-[var(--text-muted)] before:text-[var(--brand)] before:content-['./']";
const surfaceClasses = "rounded-[var(--radius-pill)] border border-[rgba(79,142,255,0.15)] bg-[var(--brand-light)] px-[0.6rem] py-[0.18rem] text-[var(--brand)]";

export function FilePathLabel({
  as: Component = "span",
  children,
  className,
  surface = false,
}: Readonly<FilePathLabelProps>) {
  return (
    <Component className={cn(baseClasses, surface && surfaceClasses, className)}>
      {children}
    </Component>
  );
}