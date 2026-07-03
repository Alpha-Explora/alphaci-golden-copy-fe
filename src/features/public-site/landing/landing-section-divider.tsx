import { motion } from "framer-motion";

import styles from "./landing-section-divider.module.css";

interface LandingSectionDividerProps {
  reduced?: boolean;
}

export function LandingSectionDivider({ reduced = false }: Readonly<LandingSectionDividerProps>) {
  return (
    <motion.hr
      className={styles.divider}
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
