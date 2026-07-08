"use client";

import { useEffect, useState } from "react";

import { Logo, PixelWordmark } from "@/components/brand";
import { PublicLink } from "@/components/ui/public-link";
import { cn } from "@/lib/utils";

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

  return (
    <header
      className={cn(
        "z-50 mx-auto grid min-h-[5.5rem] w-full max-w-[1920px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[clamp(1rem,3vw,3rem)] px-[clamp(1.2rem,4.8vw,5rem)] py-[clamp(1.45rem,2.7vw,2.35rem)] transition-all duration-300 ease-out motion-reduce:transition-none max-[820px]:gap-[0.9rem] max-[820px]:px-4 max-[520px]:grid-cols-[auto_auto] max-[520px]:gap-[0.85rem] max-[520px]:min-h-0 max-[520px]:py-[0.9rem]",
        fixed && "fixed left-1/2 right-auto top-0 max-w-none -translate-x-1/2 translate-y-0 border-b-0 bg-gradient-to-b from-slate-950/70 to-slate-950/0",
        fixed && scrolled && "translate-y-[0.35rem] border-b border-cyan-400/10 bg-slate-950/85 py-[clamp(0.85rem,1.35vw,1.15rem)] shadow-[0_14px_44px_rgba(0,0,0,0.28),inset_0_-1px_0_rgba(255,255,255,0.04)] backdrop-blur-[18px] motion-reduce:translate-y-0",
        !showActions && "grid-cols-[auto] max-[520px]:grid-cols-[auto]",
      )}
      data-active-section={active ?? undefined}
    >
      <PublicLink
        className={cn(
          "min-h-12 justify-start gap-[clamp(0.75rem,1vw,1rem)] p-0 max-[520px]:gap-[0.55rem]",
          scrolled && "-translate-y-px motion-reduce:translate-y-0",
        )}
        href="/"
        variant="nav"
        aria-label="AlphaCI home"
      >
        <span
          className={cn(
            "inline-flex aspect-[942/834] h-[clamp(2.25rem,2.75vw,2.85rem)] flex-none items-center transition-[filter,height] duration-300 motion-reduce:transition-none max-[520px]:h-[2.15rem]",
            scrolled && "h-[clamp(2.05rem,2.45vw,2.45rem)] drop-shadow-[0_0_16px_rgba(56,189,248,0.14)]",
          )}
        >
          <Logo decorative size={44} />
        </span>
        <PixelWordmark />
      </PublicLink>

      {showActions ? (
        <>
          <nav className="flex min-w-0 items-center justify-start gap-[clamp(1.25rem,2vw,2rem)] max-[520px]:col-span-full max-[520px]:row-start-2" aria-label="Primary navigation">
            <PublicLink href="/pricing" active={active === "pricing"}>
              Pricing
            </PublicLink>
          </nav>

          <div className="flex items-center justify-end gap-[clamp(0.75rem,1.4vw,1rem)] max-[520px]:ml-auto">
            <PublicLink className="max-[520px]:hidden" href="/login" variant="secondary">
              Sign In
            </PublicLink>
            <PublicLink href="/signup" variant="primary">
              <span className="inline-flex size-1.5 rounded-full bg-current" aria-hidden="true" />
              Sign Up
            </PublicLink>
          </div>
        </>
      ) : null}
    </header>
  );
}
