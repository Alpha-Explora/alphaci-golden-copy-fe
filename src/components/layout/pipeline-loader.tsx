"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PipelineLogo } from "@/components/layout/pipeline-logo";
import { FlowBackground } from "@/components/layout/flow-background";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface PipelineLoaderProps {
  label?: string;
}

/* ── Stage config ───────────────────────────────────────────────────────────── */

const STAGES = [
  { id: "source",  label: "source",  color: "var(--brand)",         glow: "rgba(56,189,248,0.45)" },
  { id: "lint",    label: "lint",    color: "var(--accent-violet)",  glow: "rgba(167,139,250,0.45)" },
  { id: "test",    label: "test",    color: "var(--accent-teal)",    glow: "rgba(45,212,191,0.45)" },
  { id: "build",   label: "build",   color: "var(--accent-coral)",   glow: "rgba(251,113,133,0.45)" },
  { id: "deploy",  label: "deploy",  color: "var(--accent-amber)",   glow: "rgba(251,191,36,0.45)" },
];

const EASE_OUT: [number, number, number, number] = [0.25, 0, 0, 1];

/* ── PipelineLoader ─────────────────────────────────────────────────────────── */

export function PipelineLoader({ label = "Loading" }: Readonly<PipelineLoaderProps>) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pulsing, setPulsing] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const cycleInterval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STAGES.length);
      setPulsing(false);
      const pulseTimer = setTimeout(() => setPulsing(true), 60);
      return () => clearTimeout(pulseTimer);
    }, 520);

    return () => clearInterval(cycleInterval);
  }, [prefersReducedMotion]);

  const activeStage = STAGES[activeIndex];

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background max-[640px]:overflow-x-hidden">
      <FlowBackground />

      <div className="relative z-[1] flex flex-col items-center gap-5 p-8" role="status" aria-label={label}>
        {/* Logo lockup */}
        <motion.div
          className="flex items-center justify-center"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <div
            className="flex size-14 items-center justify-center rounded-[14px] border-[1.5px] bg-[linear-gradient(135deg,rgba(56,189,248,0.12)_0%,rgba(167,139,250,0.08)_100%)]"
            style={prefersReducedMotion ? {} : {
              boxShadow: `0 0 28px ${activeStage?.glow ?? "rgba(56,189,248,0.45)"}`,
              borderColor: activeStage?.color ?? "var(--brand)",
              transition: "box-shadow 0.52s ease, border-color 0.52s ease",
            }}
          >
            <PipelineLogo size={28} />
          </div>
        </motion.div>

        {/* Label */}
        <motion.p
          className="m-0 text-base font-semibold text-foreground/80"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.12 }}
        >
          {label}
        </motion.p>

        {/* Stage track */}
        <motion.div
          className="flex items-start pb-5"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.22 }}
          aria-hidden="true"
        >
          {STAGES.map((stage, i) => {
            const isActive  = i === activeIndex;
            const isDone    = i < activeIndex;
            const isPending = i > activeIndex;
            return (
              <span key={stage.id} className="relative inline-flex flex-row items-center">
                {/* Node dot */}
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full border-[1.5px]"
                  style={
                    prefersReducedMotion
                      ? { background: "var(--brand)", opacity: 0.8 }
                      : {
                          background: isDone
                            ? stage.color
                            : isActive
                            ? stage.color
                            : "rgba(255,255,255,0.08)",
                          borderColor: isDone
                            ? stage.color
                            : isActive
                            ? stage.color
                            : "rgba(255,255,255,0.12)",
                          boxShadow: isActive && pulsing
                            ? `0 0 14px ${stage.glow}`
                            : "none",
                          transform: isActive ? "scale(1.35)" : "scale(1)",
                          transition:
                            "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease",
                          opacity: isPending ? 0.35 : 1,
                        }
                  }
                />

                {/* Stage label under node */}
                <span
                  className="absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-semibold lowercase"
                  style={
                    prefersReducedMotion
                      ? {}
                      : {
                          color: isActive
                            ? stage.color
                            : isDone
                            ? "var(--text-secondary)"
                            : "var(--text-muted)",
                          fontWeight: isActive ? 700 : 500,
                          transition: "color 0.3s ease, font-weight 0.1s",
                          opacity: isPending ? 0.4 : 1,
                        }
                  }
                >
                  {stage.label}
                </span>

                {/* Connector line (not after last stage) */}
                {i < STAGES.length - 1 && (
                  <span
                    className="inline-block h-px w-[clamp(2.5rem,6vw,4rem)] shrink-0 bg-white/10"
                    style={
                      prefersReducedMotion
                        ? {}
                        : {
                            background: isDone
                              ? `linear-gradient(90deg, ${stage.color}, ${STAGES[i + 1]?.color ?? stage.color})`
                              : "rgba(255,255,255,0.08)",
                            transition: "background 0.4s ease",
                          }
                    }
                    aria-hidden="true"
                  />
                )}
              </span>
            );
          })}
        </motion.div>

        {/* Traveling pulse line */}
        {!prefersReducedMotion && (
          <div className="relative mt-2 h-0.5 w-[clamp(200px,50vw,360px)] overflow-hidden rounded-sm bg-white/[0.04]" aria-hidden="true">
            <motion.span
              className="block h-full w-10 rounded-sm blur-[1px]"
              style={{ background: activeStage?.color ?? "var(--brand)" }}
              animate={{ x: ["0%", "100%"] }}
              transition={{ duration: 2.6, ease: "linear", repeat: Infinity }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
