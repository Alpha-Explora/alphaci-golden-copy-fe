export const productSharedStyles = {
  branchChip: "inline-flex items-center rounded-full border border-[rgba(79,142,255,0.25)] bg-[rgba(79,142,255,0.1)] px-[0.55rem] py-[0.15rem] font-mono text-[0.72rem] tracking-[0.02em] text-[var(--brand)]",
  branchChipMono: "border-[var(--border-soft)] bg-white/[0.04] text-[0.7rem] text-[var(--text-secondary)]",
  guestBanner: "flex w-full flex-wrap items-center justify-between gap-4 border-b border-[rgba(79,142,255,0.15)] bg-[rgba(79,142,255,0.08)] px-[clamp(1.5rem,4vw,3rem)] py-[0.65rem]",
  guestBannerGlass: "border border-[var(--border-brand)] !bg-[linear-gradient(135deg,rgba(56,189,248,0.08)_0%,rgba(15,23,42,0.7)_100%)] px-[var(--layout-gutter)] py-4 !rounded-none",
  guestBannerText: "m-0 flex items-center gap-1.5 text-[0.85rem] font-medium text-[var(--brand)]",
  guestBannerTextStrong: "m-0 text-[0.88rem] font-medium text-[var(--text-primary)]",
  guestBannerActions: "flex shrink-0 gap-2 max-[640px]:items-stretch max-[640px]:[&>*]:min-w-0 max-[640px]:[&>*]:whitespace-normal",
} as const;