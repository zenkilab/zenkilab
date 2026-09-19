"use client";

import { useRef, useState } from "react";
import { Ruler } from "lucide-react";
import { materials } from "@/lib/constants";

// Selector plus detail panel: six materials are too many for a card grid, and the
// buyer is comparing, so one panel at a time keeps the numbers readable.
export function MaterialsSection() {
  const [idx, setIdx] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const material = materials[idx];

  const select = (next: number) => {
    const n = (next + materials.length) % materials.length;
    setIdx(n);
    tabs.current[n]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(idx + 1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); select(0); }
    else if (e.key === "End") { e.preventDefault(); select(materials.length - 1); }
  };

  return (
    <section id="materials" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
          The right material for your project.
        </h2>
        <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          We&apos;ll help you choose. From everyday PLA to carbon fibre composites, there&apos;s a material that fits your application.
        </p>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Selector: vertical list on desktop, scroll-snap strip on mobile */}
          <div
            role="tablist"
            aria-label="Materials"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 pb-2 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {materials.map((m, i) => {
              const on = i === idx;
              return (
                <button
                  key={m.name}
                  ref={(el) => { tabs.current[i] = el; }}
                  role="tab"
                  id={`material-tab-${i}`}
                  aria-selected={on}
                  aria-controls="material-panel"
                  tabIndex={on ? 0 : -1}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`min-h-11 shrink-0 snap-start whitespace-nowrap rounded-xl border px-4 py-2 text-left text-sm font-medium transition-colors motion-reduce:transition-none lg:rounded-none lg:border-0 lg:border-l-2 lg:px-5 lg:py-3 ${
                    on ? "border-primary text-primary bg-primary/10 lg:bg-transparent" : "border-border text-muted-foreground hover:text-foreground lg:border-l-border"
                  } ${on ? "lg:border-l-primary" : ""}`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div role="tabpanel" id="material-panel" aria-labelledby={`material-tab-${idx}`} tabIndex={0} className="min-w-0">
            <h3 className="text-2xl font-semibold tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
              {material.name}
            </h3>
            <p className="mt-3 max-w-[60ch] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {material.description}
            </p>

            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {material.stats.map((stat) => (
                <div key={stat.label} className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: "var(--color-accent-warm)" }} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)" }}>
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {stat.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {material.shrinkage && (
              <p className="mt-8 flex items-center gap-2.5 border-t pt-5 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                <Ruler className="h-4 w-4 shrink-0" aria-hidden="true" />
                Shrinkage: <span className="font-mono" style={{ color: "var(--color-text-primary)" }}>{material.shrinkage}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
