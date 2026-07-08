export const setupResultPanelStyles = {
  actions: "mb-[0.35rem] flex flex-wrap items-stretch gap-[0.45rem] [&>*]:min-w-0 [&>*]:whitespace-normal",
  panel: "relative z-[1] h-fit max-h-[calc(100dvh-12rem)] overflow-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--panel-pad)] py-6 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-200 max-[1180px]:col-span-full max-[1180px]:max-h-none",
  repoHeader: "flex items-center gap-2",
  repoName: "break-all text-[0.9rem] font-semibold text-[var(--text-primary)] no-underline hover:underline",
  statusDot: "size-2 shrink-0 rounded-full bg-[var(--success)] shadow-[0_0_0_3px_rgba(0,208,132,0.15)]",
} as const;