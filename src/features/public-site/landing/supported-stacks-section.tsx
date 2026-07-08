"use client";

import { motion, useReducedMotion } from "framer-motion";

const STACKS = [
  { name: "Next.js", dot: "var(--brand)" },
  { name: "NestJS", dot: "#e0234e" },
  { name: "React", dot: "#61dafb" },
  { name: "Node.js", dot: "#68a063" },
  { name: "React Native", dot: "var(--brand)" },
  { name: "Expo", dot: "rgba(255,255,255,0.5)" },
  { name: "Kotlin", dot: "#7f52ff" },
  { name: "Go", dot: "#00acd7" },
  { name: "Python", dot: "#3572a5" },
  { name: "Rust", dot: "#ce422b" },
  { name: "Vue.js", dot: "#41b883" },
  { name: "Svelte", dot: "#ff3e00" },
];

const LOOPED_STACKS = [...STACKS, ...STACKS];

export function SupportedStacksSection() {
  const prefersReducedMotion = useReducedMotion();
  const stacks = prefersReducedMotion ? STACKS : LOOPED_STACKS;

  return (
    <section className="relative bg-[linear-gradient(180deg,#020617_0%,#071426_100%)] py-8" aria-label="Supported Ecosystems">
      <div className="mx-[clamp(1.5rem,6vw,5rem)] h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.18),transparent)]" />
      <p className="mb-5 mt-8 text-center font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
        Supported stacks
      </p>

      <div className="relative overflow-hidden py-[0.9rem] pb-[1.6rem] [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <motion.div
          className={prefersReducedMotion ? "flex w-auto flex-wrap justify-center gap-5" : "flex w-max gap-5 will-change-transform"}
          animate={prefersReducedMotion ? undefined : { x: ["0%", "calc(-50% - 0.625rem)"] }}
          transition={prefersReducedMotion ? undefined : { duration: 38, ease: "linear", repeat: Infinity }}
        >
          {stacks.map((stack, index) => {
            const isDuplicate = index >= STACKS.length;

            return (
              <div
                key={`${stack.name}-${index}`}
                className="inline-flex min-w-[7.6rem] flex-none items-center justify-center gap-[0.52rem] rounded-lg border border-cyan-400/15 bg-[rgba(8,19,36,0.72)] px-[1.35rem] py-[1.05rem] font-mono text-[0.8rem] tracking-normal text-[#b7c4d8] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors duration-200 hover:bg-[rgba(10,30,54,0.82)]"
                data-stack-badge="true"
                data-stack-name={stack.name}
                aria-hidden={isDuplicate ? "true" : undefined}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: stack.dot, boxShadow: `0 0 6px ${stack.dot}` }}
                  aria-hidden="true"
                />
                {stack.name}
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="mx-[clamp(1.5rem,6vw,5rem)] h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.18),transparent)]" />
    </section>
  );
}
