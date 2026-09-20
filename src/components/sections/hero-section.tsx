"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Camera, Lightbulb, Sparkles, ArrowRight } from "lucide-react";
import { projectJourneys } from "@/lib/constants";
import { Hero } from "@/components/hero3d/Hero";

/**
 * HeroSection
 * ─────────────────────────────────────────────────────────
 * Wraps the React Three Fiber hero scene (src/components/hero3d)
 * with the section shell and the "Start Your Project" dialog.
 * All heavy 3D logic lives in hero3d/, this file stays a thin composition root.
 */
const journeyIcons = [FileText, Camera, Lightbulb, Sparkles];

export function HeroSection() {
  const [showJourneys, setShowJourneys] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dialog behaviour: focus moves in, Tab stays inside, Escape closes, focus returns.
  useEffect(() => {
    if (!showJourneys) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowJourneys(false);
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [showJourneys]);

  return (
    <section
      id="home"
      className="relative min-h-[100dvh] flex items-center pt-24 pb-16 lg:pt-28 overflow-hidden bg-background"
    >
      <Hero onStart={() => setShowJourneys(true)} />

      <AnimatePresence>
        {showJourneys && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-6"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-bg-primary) 60%, transparent)" }}
            onClick={() => setShowJourneys(false)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="journey-title"
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90dvh] w-full max-w-[640px] overflow-y-auto rounded-2xl p-7 lg:p-9"
              style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 id="journey-title" className="mb-1 text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Start Your Project
                  </h2>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Choose the path that best describes your situation
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setShowJourneys(false)}
                  aria-label="Close"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {projectJourneys.map((journey, idx) => {
                  const Icon = journeyIcons[idx];
                  return (
                    <li key={journey.title} style={{ borderColor: "var(--color-border)" }}>
                      <a
                        href={journey.href}
                        onClick={() => setShowJourneys(false)}
                        className="group flex min-h-16 items-start gap-4 py-4"
                      >
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
                        >
                          <Icon className="h-4 w-4" style={{ color: "var(--color-accent-warm)" }} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 block text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            {journey.title}
                          </span>
                          <span className="block text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            {journey.description}
                          </span>
                        </span>
                        <ArrowRight
                          className="mt-2 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                          style={{ color: "var(--color-accent-primary)" }}
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
