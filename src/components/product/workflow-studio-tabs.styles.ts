export const workflowStudioTabStyles = {
  bar: "flex overflow-x-auto border-b border-white/[0.06] bg-[rgba(10,15,30,0.6)] px-[var(--layout-gutter)] shadow-[var(--shadow-soft)] backdrop-blur-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  button: "relative z-[1] inline-flex shrink-0 cursor-pointer items-center gap-2 border-0 border-b-2 border-transparent bg-transparent px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] aria-selected:border-[var(--brand)] aria-selected:text-[var(--brand)]",
  icon: "inline-flex size-3.5 shrink-0 items-center justify-center",
  label: "relative z-[1] inline-flex items-center gap-2 whitespace-nowrap",
  indicator: "absolute inset-0 rounded-lg border border-sky-400/25 bg-sky-400/[0.08] shadow-[0_0_16px_rgba(56,189,248,0.1),inset_0_0_0_1px_rgba(56,189,248,0.1)]",
  trailing: "ml-auto inline-flex shrink-0 items-center gap-3 pl-4",
} as const;