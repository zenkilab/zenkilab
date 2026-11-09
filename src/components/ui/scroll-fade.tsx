"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-linked entrance: the block fades in and rises as it travels up the screen,
 * so it is tied to where the visitor is, not to a one-off trigger.
 * Static under reduced motion, and visible without JavaScript (the noscript rule in the root layout):
 * both in CSS, since the server can't know either and a branch in render would mismatch on hydration.
 */
export function ScrollFade({
  children,
  className,
  distance = 36,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 62%"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [distance, 0]);
  return (
    <motion.div ref={ref} data-sf="" className={`motion-reduce:[opacity:1!important] motion-reduce:[transform:none!important] ${className ?? ""}`} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}
