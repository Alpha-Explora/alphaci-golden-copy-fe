import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import styles from "./public-link.module.css";

type PublicLinkVariant = "nav" | "primary" | "secondary";

export interface PublicLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  active?: boolean;
  children: ReactNode;
  showChevron?: boolean;
  variant?: PublicLinkVariant;
}

export function PublicLink({
  active = false,
  children,
  className,
  showChevron = false,
  variant = "nav",
  ...props
}: Readonly<PublicLinkProps>) {
  const classNames = [styles.link, styles[variant], active ? styles.active : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const ariaCurrent = active ? "page" : props["aria-current"];

  return (
    <Link {...props} className={classNames} aria-current={ariaCurrent}>
      <span className={styles.label}>{children}</span>
      {showChevron ? (
        <span className={styles.chevron} aria-hidden="true">
          {"> "}
        </span>
      ) : null}
    </Link>
  );
}