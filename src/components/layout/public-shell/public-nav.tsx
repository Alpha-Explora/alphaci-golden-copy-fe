"use client";

import { useEffect, useState } from "react";

import { Logo, PixelWordmark } from "@/components/brand";
import { PublicLink } from "@/components/ui/public-link";

import styles from "./public-nav.module.css";

type PublicNavActive = "features" | "guide" | "pricing";

export interface PublicNavProps {
  active?: PublicNavActive;
  fixed?: boolean;
  showActions?: boolean;
}

export function PublicNav({ active, fixed = false, showActions = true }: Readonly<PublicNavProps>) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!fixed) return;

    function updateScrolled() {
      setScrolled(window.scrollY > 12);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, [fixed]);

  const classNames = [
    styles.nav,
    fixed ? styles.fixed : "",
    fixed && scrolled ? styles.scrolled : "",
    !showActions ? styles.noActions : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classNames} data-active-section={active ?? undefined}>
      <PublicLink className={styles.brand} href="/" variant="nav" aria-label="AlphaCI home">
        <span className={styles.brandMark}>
          <Logo decorative size={44} />
        </span>
        <PixelWordmark />
      </PublicLink>

      {showActions ? (
        <>
          <nav className={styles.links} aria-label="Primary navigation">
            <PublicLink href="/pricing" active={active === "pricing"}>
              Pricing
            </PublicLink>
          </nav>

          <div className={styles.actions}>
            <PublicLink href="/login" variant="secondary">
              Sign In
            </PublicLink>
            <PublicLink href="/signup" variant="primary">
              <span className={styles.ctaDot} aria-hidden="true" />
              Sign Up
            </PublicLink>
          </div>
        </>
      ) : null}
    </header>
  );
}