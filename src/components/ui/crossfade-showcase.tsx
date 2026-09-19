"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type ShowcaseItem = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  href: string;
  cta: string;
  image: string;
  alt: string;
  icon?: LucideIcon;
  /** CSS object-position for the image, default centre */
  focus?: string;
};

/**
 * Fixed-column crossfade (DESIGN_SYSTEM.md section 4).
 * Desktop: one image column stays pinned while its image crossfades to match the
 * text block in view. Scroll, hover and keyboard focus all change the active block.
 * Mobile: no pinning, each block carries its own image.
 */
export function CrossfadeShowcase({
  items,
  aspect = "4 / 3",
}: {
  items: ShowcaseItem[];
  aspect?: string;
}) {
  const [active, setActive] = useState(0);
  const blocks = useRef<(HTMLElement | null)[]>([]);

  // A thin band across the middle of the viewport decides which block is active.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    blocks.current.forEach((b) => b && io.observe(b));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-20">
      {/* Pinned image column, desktop only */}
      <div className="hidden lg:sticky lg:top-28 lg:block">
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: aspect, backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
        >
          {items.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.image}
              alt={item.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              aria-hidden={active !== i}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition: item.focus }}
            />
          ))}
        </div>
      </div>

      {/* Text blocks */}
      <div className="flex flex-col gap-12 lg:gap-0">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <article
              key={item.id}
              ref={(el) => {
                blocks.current[i] = el;
              }}
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onFocusCapture={() => setActive(i)}
              className={`flex flex-col justify-center border-l-2 pl-6 transition-colors duration-300 motion-reduce:transition-none lg:min-h-[55vh] lg:pl-8 ${
                active === i ? "border-primary" : "border-border"
              }`}
            >
              {/* Mobile image */}
              <div
                className="relative mb-6 w-full overflow-hidden rounded-2xl lg:hidden"
                style={{ aspectRatio: aspect, backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: item.focus }}
                />
              </div>

              {Icon && (
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--color-accent-warm)" }} aria-hidden="true" />
                </div>
              )}

              <h3 className="text-2xl font-semibold tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
                {item.title}
              </h3>
              <p className="mt-3 max-w-[52ch] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.description}
              </p>

              {item.bullets && item.bullets.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
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

              <Link
                href={item.href}
                className="group mt-6 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold"
                style={{ color: "var(--color-accent-primary)" }}
              >
                {item.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
