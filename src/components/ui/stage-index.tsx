"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";

export type StageItem = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  href: string;
  cta: string;
  image: string;
  alt: string;
  focus?: string;
};

/**
 * Stage and index: one large image, a list of titles beside it. Choosing an item
 * (click, tap, hover or arrow keys) swaps the image, so nothing depends on scroll.
 * The image drifts slightly with the cursor on fine pointers.
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

  useEffect(() => {
    fine.current = window.matchMedia("(pointer: fine)").matches;
  }, []);

  const select = (n: number, focus = false) => {
    const next = (n + items.length) % items.length;
    setIdx(next);
    if (focus) tabs.current[next]?.focus();
  };

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
      <div
        role="tabpanel"
        id="stage-panel"
        aria-labelledby={`stage-tab-${idx}`}
        className="relative aspect-[4/3] overflow-hidden rounded-2xl"
        style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
        onPointerMove={(e) => {
          if (reduce || !fine.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(((e.clientX - r.left) / r.width - 0.5) * -22);
          my.set(((e.clientY - r.top) / r.height - 0.5) * -16);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
      >
        {items.map((item, i) => (
          <motion.div key={item.id} aria-hidden={i !== idx} className="absolute inset-0" style={{ x: sx, y: sy, scale: 1.08 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-[opacity,clip-path,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{
                objectPosition: item.focus,
                opacity: i === idx ? 1 : 0,
                clipPath: i === idx ? "inset(0 0 0 0)" : "inset(0 0 0 14%)",
                transform: i === idx ? "scale(1)" : "scale(1.06)",
              }}
            />
          </motion.div>
        ))}
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
