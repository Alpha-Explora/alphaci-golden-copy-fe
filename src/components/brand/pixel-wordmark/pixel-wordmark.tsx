import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface PixelWordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  text?: string;
}

export function PixelWordmark({ className, text = "AlphaCI", ...props }: Readonly<PixelWordmarkProps>) {
  return (
    <span
      className={cn(
        "whitespace-nowrap text-[clamp(1.86rem,2.6vw,2.75rem)] font-extrabold leading-none tracking-normal text-[var(--text-primary)] [font-family:var(--font-display),var(--font-dash-display),sans-serif] [text-shadow:0_0_20px_rgba(56,189,248,0.11)]",
        className,
      )}
      {...props}
    >
      {text}
    </span>
  );
}
