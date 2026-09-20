"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

export type StageItem = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  href: string;
  cta: string;
  /** 4:3 photo, shown dimmed, softly blurred and faded at the edges */
  bg: string;
  /** The same photo with only the subject kept, drawn sharp on top so it comes out of the fade */
  cut: string;
  alt: string;
};

/**
 * Stage and index: one large scene, a list of titles beside it. Choosing an item (click, tap,
 * hover or arrow keys) swaps the scene, so nothing depends on scroll position.
 * The photo behind is dimmed, softly blurred and faded into the page, and the subject stands
 * sharp in front of it. On fine pointers the two layers drift a little differently with the
 * cursor, which gives the scene depth. No frame, no hard edges.
 */
export function StageIndex({ items }: { items: StageItem[] }) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const fine = useRef(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 20 });
  const sy = useSpring(my, { stiffness: 90, damping: 20 });
  // background drifts against the subject
  const bx = useTransform(sx, (v) => -v * 0.6);
  const by = useTransform(sy, (v) => -v * 0.6);

  useEffect(() => {
    fine.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  const select = (n: number, focus = false) => {
    const next = (n + items.length) % items.length;
    setIdx(next);
    if (focus) tabs.current[next]?.focus();
  };

  const feather = "radial-gradient(ellipse 70% 68% at 50% 50%, #000 42%, transparent 100%)";
  // the subject layer only loses its outermost edge, so a subject the photo crops at the border fades out instead of ending in a hard line
  const edgeSoft = "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 95%, transparent)";

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
      <div
        role="tabpanel"
        id="stage-panel"
        aria-labelledby={`stage-tab-${idx}`}
        className="relative aspect-[4/3]"
        onPointerMove={(e) => {
          if (reduce || !fine.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(((e.clientX - r.left) / r.width - 0.5) * 26);
          my.set(((e.clientY - r.top) / r.height - 0.5) * 18);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        {/* Background: dimmed, soft, faded into the page */}
        <motion.div className="absolute inset-0" style={{ x: reduce ? 0 : bx, y: reduce ? 0 : by, WebkitMaskImage: feather, maskImage: feather }}>
          {items.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.bg}
              alt={i === idx ? item.alt : ""}
              aria-hidden={i !== idx}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: i === idx ? 1 : 0,
                filter: "brightness(0.55) saturate(0.9) blur(2.5px)",
                transform: "scale(1.03)",
                transition: "opacity 700ms ease",
              }}
            />
          ))}
        </motion.div>

        {/* Subject: sharp, full brightness, comes out of the fade */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ x: reduce ? 0 : sx, y: reduce ? 0 : sy, WebkitMaskImage: edgeSoft, maskImage: edgeSoft, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}
        >
          {items.map((item, i) => {
            const on = i === idx;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.cut}
                alt=""
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: on ? 1 : 0,
                  transform: reduce ? "none" : on ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
                  transformOrigin: "50% 80%",
                  transition: on
                    ? "opacity 500ms ease 120ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms"
                    : "opacity 250ms ease, transform 250ms ease",
                }}
              />
            );
          })}
        </motion.div>
      </div>

      <div
        role="tablist"
        aria-label="Services"
        aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            select(idx + 1, true);
          } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            select(idx - 1, true);
          }
        }}
        className="flex flex-col"
      >
        {items.map((item, i) => {
          const on = i === idx;
          return (
            <div
              key={item.id}
              className="border-l-2 transition-colors duration-300 motion-reduce:transition-none"
              style={{ borderColor: on ? "var(--color-accent-primary)" : "var(--color-border)" }}
            >
              <button
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`stage-tab-${i}`}
                aria-selected={on}
                aria-controls="stage-panel"
                tabIndex={on ? 0 : -1}
                type="button"
                onClick={() => setIdx(i)}
                onMouseEnter={() => {
                  if (fine.current) setIdx(i);
                }}
                className="flex min-h-12 w-full items-center px-6 py-3 text-left font-[family-name:var(--font-wordmark)] text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold tracking-[-0.01em] transition-colors duration-300 motion-reduce:transition-none"
                style={{ color: on ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
              >
                {item.title}
              </button>
              {on && (
                <div className="animate-in fade-in slide-in-from-top-1 px-6 pb-5 duration-300 motion-reduce:animate-none">
                  <p className="max-w-[46ch] text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.description}
                  </p>
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {item.bullets.map((b) => (
                        <li
                          key={b}
                          className="rounded-lg px-2.5 py-1 text-xs"
                          style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={item.href} className="group mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-accent-primary)" }}>
                    {item.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
