"use client";

import { type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const PARALLAX = {
  darkLayer: -100,
} as const;

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: -1,
  pointerEvents: "none",
  overflow: "hidden",
  background: "var(--bg-base)",
};

const DARK_STATIC_GRADIENT =
  "radial-gradient(ellipse 60% 50% at 75% -10%, rgba(59,130,246,0.28) 0%, transparent 60%)," +
  "radial-gradient(ellipse 50% 40% at 20% 0%, rgba(139,92,246,0.25) 0%, transparent 60%)," +
  "radial-gradient(ellipse 40% 35% at 50% 90%, rgba(79,70,229,0.22) 0%, transparent 60%)";

export function FlowBackground() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const darkParallax = useTransform(scrollYProgress, [0, 1], [0, PARALLAX.darkLayer]);

  if (reduced) {
    return (
      <div className="flow-bg" aria-hidden="true" style={{ ...ROOT_STYLE, opacity: 1 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: DARK_STATIC_GRADIENT,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flow-bg" aria-hidden="true" style={ROOT_STYLE}>
      <motion.div
        style={{ position: "absolute", inset: 0, y: darkParallax, willChange: "transform" }}
      >
        <div style={{
          position: "absolute",
          width: "85vw",
          height: "85vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #3b82f6 0%, #1d4ed8 40%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.20,
          top: "-22%",
          right: "-18%",
          animation: "orb-drift-a 20s ease-in-out infinite",
        }} />

        <div style={{
          position: "absolute",
          width: "75vw",
          height: "75vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #8b5cf6 0%, #6d28d9 45%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.22,
          top: "-12%",
          left: "-22%",
          animation: "orb-drift-b 26s ease-in-out infinite",
        }} />

        <div style={{
          position: "absolute",
          width: "70vw",
          height: "70vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #06b6d4 0%, #0284c7 45%, transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.18,
          bottom: "-18%",
          left: "22%",
          animation: "orb-drift-c 30s ease-in-out infinite",
        }} />

        <div style={{
          position: "absolute",
          width: "62vw",
          height: "62vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #10b981 0%, #059669 45%, transparent 70%)",
          filter: "blur(52px)",
          opacity: 0.16,
          bottom: "-12%",
          right: "-12%",
          animation: "orb-drift-d 24s ease-in-out infinite",
        }} />

        <div style={{
          position: "absolute",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #4f46e5 0%, #3730a3 50%, transparent 70%)",
          filter: "blur(52px)",
          opacity: 0.16,
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          animation: "orb-pulse-e 18s ease-in-out infinite",
        }} />

        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
      </motion.div>
    </div>
  );
}
