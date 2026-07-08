export type StatusBannerTone = "error" | "success" | "info";

export const feedbackStyles = {
  statusBanner: "flex items-start gap-2 whitespace-normal break-words rounded-lg px-3.5 py-2 text-[0.88rem] font-semibold leading-[1.45] [overflow-wrap:anywhere]",
  statusBannerTone: {
    success: "border border-[rgba(0,208,132,0.3)] bg-[rgba(0,208,132,0.08)] text-[#00d084]",
    info: "border border-[rgba(79,142,255,0.3)] bg-[rgba(79,142,255,0.08)] text-[var(--brand)]",
    error: "border border-[rgba(255,79,79,0.3)] bg-[rgba(255,79,79,0.08)] text-[#ff8b8b]",
  } satisfies Record<StatusBannerTone, string>,
  inlineError: "mt-3 flex items-center gap-[0.55rem] rounded-[0.84rem] border border-[rgba(255,79,79,0.3)] bg-[rgba(255,79,79,0.08)] px-[0.74rem] py-[0.55rem] text-[0.86rem] text-[#ff8b8b]",
  inlineErrorGlass: "!border-[rgba(248,113,113,0.2)] !bg-[rgba(248,113,113,0.05)]",
  inlineErrorIcon: "shrink-0 not-italic text-base",
  inlineErrorMessage: "m-0 flex-1",
  skeletonCard: "rounded-[var(--radius-card)] border border-white/10 bg-[rgba(15,23,42,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-[24px] animate-pulse",
  kpiSkeletonValue: "inline-block h-6 w-11 animate-pulse rounded-[0.4rem] bg-[var(--bg-elevated)] align-middle",
} as const;
