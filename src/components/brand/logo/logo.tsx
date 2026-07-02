import Image from "next/image";

import styles from "./logo.module.css";

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
  const classNames = [styles.logo, className ?? ""].filter(Boolean).join(" ");

  return (
    <Image
      className={classNames}
      src="/alphaci-logo-blue-transparent-v3.png"
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      width={width}
      height={size}
      priority={priority}
      unoptimized
      style={{
        width,
        height: size,
      }}
    />
  );
}