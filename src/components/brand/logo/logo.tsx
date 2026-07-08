import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_ASPECT_RATIO = 942 / 834;

export interface LogoProps {
  alt?: string;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
  size?: number;
}

export function Logo({
  alt = "AlphaCI",
  className,
  decorative = false,
  priority = false,
  size = 28,
}: Readonly<LogoProps>) {
  const width = Math.round(size * LOGO_ASPECT_RATIO);

  return (
    <Image
      className={cn("block object-contain", className)}
      src="/alphaci-logo-blue-transparent-v3.png"
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      width={width}
      height={size}
      priority={priority}
      unoptimized
      style={{
        width,
        height: "auto",
      }}
    />
  );
}
