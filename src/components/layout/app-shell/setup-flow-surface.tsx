import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface SetupFlowSurfaceProps extends ComponentPropsWithoutRef<"div"> {
  contentClassName?: string;
}

export function SetupFlowSurface({
  children,
  className,
  contentClassName,
  ...props
}: Readonly<SetupFlowSurfaceProps>) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.022)_1px,transparent_1px)] [background-position:center_top] [background-size:2rem_2rem] [mask-image:radial-gradient(circle_at_center,black_0%,black_42%,transparent_82%)]"
        aria-hidden="true"
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
