"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

export type StoreListItem = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  href: string;
  cta: string;
  image: string;
  alt: string;
  focus?: string;
  meta?: string;
};

// Quiet product grid: large photography, a single line of type, one link.
// The photo drifts a few percent as it passes and eases in on hover. Nothing pins.
function Product({ item, index }: { item: StoreListItem; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <motion.article
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={item.href} className="group block focus-visible:outline-none">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-2xl transition-colors duration-500 group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring motion-reduce:transition-none"
          style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035] motion-reduce:transition-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={item.image}
              alt={item.alt}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="absolute left-0 top-[-6%] h-[112%] w-full object-cover"
              style={{ y: reduce ? 0 : y, objectPosition: item.focus }}
            />
          </div>
        </div>

        <div className="mt-8 flex items-baseline justify-between gap-6">
          <h2 className="text-[clamp(1.6rem,2.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>
            {item.title}
          </h2>
          {item.meta && (
            <span className="shrink-0 font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {item.meta}
            </span>
          )}
        </div>

        <p className="mt-3 max-w-[46ch] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {item.description}
        </p>

        {item.bullets && item.bullets.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {item.bullets.map((b) => (
              <li key={b} className="border-l px-3 first:border-l-0 first:pl-0" style={{ borderColor: "var(--color-border)" }}>
                {b}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-accent-primary)" }}>
          {item.cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </Link>
    </motion.article>
  );
}

export function StoreGrid({ items }: { items: StoreListItem[] }) {
  return (
    <div className="grid gap-x-10 gap-y-20 md:grid-cols-2 lg:gap-x-16">
      {items.map((item, i) => (
        <Product key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
