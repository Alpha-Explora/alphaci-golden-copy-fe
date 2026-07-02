import type { HTMLAttributes } from "react";

import styles from "./pixel-wordmark.module.css";

export interface PixelWordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  text?: string;
}

export function PixelWordmark({ className, text = "AlphaCI", ...props }: Readonly<PixelWordmarkProps>) {
  const classNames = [styles.wordmark, className ?? ""].filter(Boolean).join(" ");

  return (
    <span className={classNames} {...props}>
      {text}
    </span>
  );
}
