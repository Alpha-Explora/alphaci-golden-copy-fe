"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type NavIconComponent = (props: { size?: number }) => ReactNode;

export function DashboardIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

export function WorkflowsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}

export function RunsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><path d="M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" /></svg>;
}

export function BillingIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
}

export function SettingsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49M4.93 4.93a10 10 0 0 0 0 14.14M7.76 7.76a6 6 0 0 0 0 8.49" /></svg>;
}

export function AdminIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
}

export function SignOutIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}

export function ChevronLeftIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>;
}

function SidebarTooltip({ text, children }: { text: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex w-full" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}>
      {children}
      <AnimatePresence>{visible && <motion.div className="pointer-events-none absolute left-[calc(100%_+_10px)] top-1/2 z-[300] -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-panel)] px-[0.65rem] py-[0.35rem] text-[0.75rem] font-semibold text-[var(--text-primary)]" initial={{ opacity: 0, x: -6, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -6, scale: 0.92 }} transition={{ duration: 0.14 }}>{text}</motion.div>}</AnimatePresence>
    </div>
  );
}

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: NavIconComponent;
  isActive: boolean;
  collapsed: boolean;
  reduced: boolean;
  itemIndex?: number;
}

export function SidebarNavItem({ href, label, icon: NavIcon, isActive, collapsed, reduced, itemIndex = 0 }: Readonly<SidebarNavItemProps>) {
  const expandDelay = itemIndex * 0.04;
  const collapseDelay = itemIndex * 0.018;
  const inner = (
    <motion.div className="relative flex w-full" initial={false} animate={{ opacity: 1, x: 0 }} whileHover={reduced ? undefined : { x: 2 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
      <Link href={href} className={cn("relative flex min-h-[2.2rem] w-full items-center gap-[0.68rem] overflow-hidden rounded-[7px] border border-transparent px-[0.7rem] py-[0.52rem] text-[0.83rem] font-semibold text-[var(--text-secondary)] no-underline transition-[background-color,border-color,color] duration-150 hover:border-slate-400/20 hover:bg-slate-400/10 hover:text-[var(--text-primary)] focus-visible:border-slate-400/20 focus-visible:bg-slate-400/10 focus-visible:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]", isActive && "text-[var(--text-primary)]")} aria-current={isActive ? "page" : undefined}>
        {isActive && <motion.span layoutId="sidebar-active-pill" className="absolute inset-0 -z-[1] rounded-[inherit] border-l-2 border-l-[var(--brand)] bg-cyan-400/10" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} aria-hidden="true" />}
        <motion.span className="relative z-[1] inline-flex size-4 flex-none items-center justify-center" animate={isActive ? { color: "var(--accent-indigo)" } : { color: "var(--text-secondary)" }} whileHover={reduced ? undefined : { scale: 1.12 }} transition={{ duration: 0.2 }}><NavIcon size={16} /></motion.span>
        <AnimatePresence initial={false}>{!collapsed && <motion.span className="relative z-[1] whitespace-nowrap" initial={reduced ? false : { opacity: 0, x: -10, width: 0 }} animate={{ opacity: 1, x: 0, width: "auto" }} exit={reduced ? undefined : { opacity: 0, x: -6, width: 0 }} transition={{ duration: 0.2, ease: [0.25, 0, 0, 1], delay: collapsed ? collapseDelay : expandDelay }}>{label}</motion.span>}</AnimatePresence>
      </Link>
    </motion.div>
  );
  return collapsed ? <SidebarTooltip text={label}>{inner}</SidebarTooltip> : inner;
}

export function SidebarSectionLabel({ text, collapsed }: { text: string; collapsed: boolean }) {
  return collapsed ? <Separator className="mx-auto mb-[0.4rem] mt-[0.8rem] w-6 bg-slate-400/20" aria-hidden="true" /> : <div className="mb-[0.3rem] ml-2 mr-2 mt-3 text-[0.64rem] font-semibold text-[var(--text-muted)]" aria-hidden="true">{text}</div>;
}
