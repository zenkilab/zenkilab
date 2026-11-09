import { useSyncExternalStore } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const REDUCE = "(prefers-reduced-motion: reduce)"

/**
 * The visitor's reduced-motion setting, safe to render with: false on the server and while hydrating, then the
 * real value. framer-motion's useReducedMotion reads it on the first client render, so anything rendered from it
 * mismatches the server HTML (React error 418) for visitors who ask for reduced motion.
 */
export function useReducedMotionSafe() {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(REDUCE)
      mq.addEventListener("change", on)
      return () => mq.removeEventListener("change", on)
    },
    () => window.matchMedia(REDUCE).matches,
    () => false,
  )
}
