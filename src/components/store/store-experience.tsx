"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DepthRings } from "./depth-rings";

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

const muted = { color: "var(--color-text-secondary)" };
const frameStyle = { backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" };

/** Scroll-linked effects run on desktop only, and never under reduced motion. */
function useDepth() {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktop(mq.matches);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return !reduce && desktop;
}

/* ───────────── Intro: layered photos on rings, each layer at its own speed ───────────── */

function Intro({ items }: { items: StoreListItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const depth = useDepth();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backY = useTransform(p, [0, 1], [0, -50]);
  const frontY = useTransform(p, [0, 1], [0, -150]);
  const ringA = useTransform(p, [0, 1], [0, 60]);
  const ringB = useTransform(p, [0, 1], [0, -90]);
  const textY = useTransform(p, [0, 1], [0, -30]);
  const textOpacity = useTransform(p, [0, 0.75], [1, 0]);
  const [front, back] = items;

  return (
    <section ref={ref} className="relative flex min-h-[92dvh] items-center overflow-hidden pb-12 pt-28">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <motion.div style={depth ? { y: textY, opacity: textOpacity } : undefined}>
          <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.95] tracking-[-0.04em]">Store</h1>
          <p className="mt-8 max-w-[38ch] text-lg leading-relaxed" style={muted}>
            Two things you can order today, made to order in Kaduwela, Sri Lanka.
          </p>
        </motion.div>

        <div className="relative mx-auto aspect-[5/6] w-full max-w-[560px] lg:ml-auto lg:mr-0">
          <DepthRings outer={depth ? ringA : undefined} inner={depth ? ringB : undefined} className="pointer-events-none absolute -inset-[14%] h-[128%] w-[128%]" />

          <motion.div className="absolute right-0 top-0 w-[60%]" style={depth ? { y: backY } : undefined}>
            <Link href={back.href} aria-label={back.title} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl transition-colors duration-500 group-hover:border-primary/40 motion-reduce:transition-none" style={frameStyle}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={back.image} alt={back.alt} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transition-none" style={{ objectPosition: back.focus }} />
              </div>
            </Link>
          </motion.div>

          <motion.div className="absolute bottom-0 left-0 z-10 w-[48%]" style={depth ? { y: frontY } : undefined}>
            <Link href={front.href} aria-label={front.title} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl transition-colors duration-500 group-hover:border-primary/40 motion-reduce:transition-none" style={frameStyle}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={front.image} alt={front.alt} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transition-none" style={{ objectPosition: front.focus }} />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Scene: one product, scrubbed by scroll on desktop ───────────── */

function Scene({ item, flip }: { item: StoreListItem; flip: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepth();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const scale = useTransform(p, [0, 0.3], [0.86, 1]);
  const imgY = useTransform(p, [0, 1], ["-6%", "6%"]);
  const ringA = useTransform(p, [0, 1], [-35, 45]);
  const ringB = useTransform(p, [0, 1], [40, -50]);
  const titleO = useTransform(p, [0.08, 0.28], [0, 1]);
  const titleY = useTransform(p, [0.08, 0.28], [44, 0]);
  const descO = useTransform(p, [0.2, 0.4], [0, 1]);
  const descY = useTransform(p, [0.2, 0.4], [36, 0]);
  const listO = useTransform(p, [0.3, 0.5], [0, 1]);
  const listY = useTransform(p, [0.3, 0.5], [30, 0]);
  const ctaO = useTransform(p, [0.4, 0.6], [0, 1]);
  const ctaY = useTransform(p, [0.4, 0.6], [24, 0]);

  const rise = (o: typeof titleO, y: typeof titleY) => (depth ? { opacity: o, y } : undefined);

  return (
    <div ref={ref} className={depth ? "h-[215vh]" : ""}>
      <div className={depth ? "sticky top-0 flex h-[100dvh] items-center pt-16" : "py-16"}>
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          <div className={`relative lg:col-span-6 ${flip ? "lg:order-2" : ""}`}>
            <DepthRings outer={depth ? ringA : undefined} inner={depth ? ringB : undefined} className="pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2" />
            <motion.div style={depth ? { scale } : undefined} className="relative mx-auto aspect-[4/5] w-full max-w-[520px] lg:h-[min(72dvh,720px)] lg:w-auto lg:max-w-none">
              <Link href={item.href} aria-label={item.title} className="group block h-full">
                <div className="relative h-full w-full overflow-hidden rounded-2xl transition-colors duration-500 group-hover:border-primary/40 motion-reduce:transition-none" style={frameStyle}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute left-0 top-[-8%] h-[116%] w-full object-cover"
                    style={{ y: depth ? imgY : 0, objectPosition: item.focus }}
                  />
                </div>
              </Link>
            </motion.div>
          </div>

          <div className={`relative z-10 lg:col-span-6 ${flip ? "lg:order-1" : ""}`}>
            <motion.h2 style={rise(titleO, titleY)} className="text-[clamp(2.75rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em]">
              {item.title}
            </motion.h2>
            {item.meta && (
              <motion.p style={rise(titleO, titleY)} className="mt-5 font-mono text-lg" >
                <span style={{ color: "var(--color-accent-primary)" }}>{item.meta}</span>
              </motion.p>
            )}
            <motion.p style={rise(descO, descY)} className="mt-7 max-w-[44ch] text-lg leading-relaxed" >
              <span style={muted}>{item.description}</span>
            </motion.p>
            {item.bullets && item.bullets.length > 0 && (
              <motion.ul style={rise(listO, listY)} className="mt-6 flex flex-wrap gap-y-1 text-sm" >
                {item.bullets.map((b) => (
                  <li key={b} className="border-l px-3.5 first:border-l-0 first:pl-0" style={{ borderColor: "var(--color-border)", ...muted }}>
                    {b}
                  </li>
                ))}
              </motion.ul>
            )}
            <motion.div style={rise(ctaO, ctaY)} className="mt-9">
              <Link
                href={item.href}
                className="group inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-[color:var(--color-accent-primary-light)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                {item.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreExperience({ items }: { items: StoreListItem[] }) {
  return (
    <>
      <Intro items={items} />
      {items.map((item, i) => (
        <Scene key={item.id} item={item} flip={i % 2 === 1} />
      ))}
    </>
  );
}
