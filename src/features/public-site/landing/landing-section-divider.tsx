import { motion } from "framer-motion";

interface LandingSectionDividerProps {
  reduced?: boolean;
}

export function LandingSectionDivider({ reduced = false }: Readonly<LandingSectionDividerProps>) {
  return (
    <motion.hr
      className="m-0 h-px w-full border-0 bg-[linear-gradient(90deg,transparent_0%,var(--border-brand)_30%,rgba(0,208,132,0.3)_60%,transparent_100%)]"
      data-landing-section-divider="true"
      aria-hidden="true"
      initial={reduced ? undefined : { scaleX: 0, opacity: 0 }}
      whileInView={reduced ? undefined : { scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      style={{ transformOrigin: "center" }}
    />
  );
}
