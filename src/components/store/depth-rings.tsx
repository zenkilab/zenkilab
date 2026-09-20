"use client";

import { motion, type MotionValue } from "framer-motion";

/**
 * The logomark's two rings (amber dashed, cyan solid) drawn large and thin as a depth
 * layer behind photography. Each ring is turned by a scroll-linked value, in opposite
 * directions, so it moves at a different rate from the image in front of it.
 */
export function DepthRings({
  outer,
  inner,
  className,
}: {
  outer?: MotionValue<number>;
  inner?: MotionValue<number>;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      <motion.g style={{ rotate: outer }}>
        <circle cx="100" cy="100" r="97" stroke="var(--color-accent-primary)" strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="3 2.4" />
      </motion.g>
      <motion.g style={{ rotate: inner }}>
        <circle cx="100" cy="100" r="74" stroke="var(--color-accent-warm)" strokeOpacity="0.28" strokeWidth="0.6" />
      </motion.g>
    </svg>
  );
}
