"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DepthRings } from "./depth-rings";
import { CircleStage } from "./circle-stage";
import type { StageSlide } from "@/lib/stage";

// The real 3D key tag loads wherever motion is allowed (phones included), everyone else gets the still.
const KeyTagSpin = dynamic(() => import("./key-tag-spin"), { ssr: false });

export type StoreListItem = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  href: string;
  cta: string;
  alt: string;
  stage: StageSlide[];
  meta?: string;
};

const muted = { color: "var(--color-text-secondary)" };

/**
 * What motion this visitor gets. `on`: scroll-linked effects (the key tag turns, rings and photos drift),
 * for every screen size unless the visitor asked for reduced motion. `pinned`: the tall pinned scenes with
 * text that builds up as you scroll, desktop only, since a pinned pane fights the phone's moving address bar.
 */
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
  return { on: !reduce, pinned: !reduce && desktop };
}

/* ───────────── Intro: two circles on turning rings, each layer at its own speed ───────────── */

function Intro({ items }: { items: StoreListItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const { on, pinned } = useDepth();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backY = useTransform(p, [0, 1], [0, -50]);
  const frontY = useTransform(p, [0, 1], [0, -150]);
  const ringA = useTransform(p, [0, 1], [0, 60]);
  const ringB = useTransform(p, [0, 1], [0, -90]);
  const textY = useTransform(p, [0, 1], [0, -30]);
  const textOpacity = useTransform(p, [0, 0.75], [1, 0]);
  const tagYaw = useTransform(p, [0, 1], [-0.4, 0.3]);
  const [front, back] = items;

  return (
    <section ref={ref} className="relative flex min-h-[92dvh] items-center overflow-hidden pb-12 pt-28">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <motion.div style={pinned ? { y: textY, opacity: textOpacity } : undefined}>
          <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-bold leading-[0.95] tracking-[-0.04em]">Store</h1>
          <p className="mt-8 max-w-[38ch] text-lg leading-relaxed" style={muted}>
            Designed by you. Printed by us.
          </p>
        </motion.div>

        <div className="relative mx-auto aspect-[5/6] w-full max-w-[560px] lg:ml-auto lg:mr-0">
          <DepthRings outer={on ? ringA : undefined} inner={on ? ringB : undefined} className="pointer-events-none absolute -inset-[14%] h-[128%] w-[128%]" />

          <motion.div className="absolute right-0 top-[15%] w-[58%]" style={on ? { y: backY } : undefined}>
            <CircleStage slides={back.stage.slice(0, 1)} href={back.href} label={back.title} controls={false} />
          </motion.div>

          <motion.div className="absolute bottom-[4%] left-[3%] z-10 w-[42%]" style={on ? { y: frontY } : undefined}>
            {on && front.id === "key-tag" ? (
              <Link href={front.href} aria-label={front.title} className="block rounded-full">
                <KeyTagSpin yaw={tagYaw} />
              </Link>
            ) : (
              <CircleStage slides={front.stage} href={front.href} label={front.title} controls={false} />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Scene: one product, scrubbed by scroll on desktop ───────────── */

function Scene(props: { item: StoreListItem; flip: boolean }) {
  const { pinned } = useDepth();
  return <SceneBody key={pinned ? "pinned" : "flow"} pinned={pinned} {...props} />;
}

function SceneBody({ item, flip, pinned }: { item: StoreListItem; flip: boolean; pinned: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const { on } = useDepth();
  // Pinned: progress runs over the tall track. Otherwise: over the circle's own trip up the screen,
  // so the tag turns while it is actually in view (front-on in the middle of the screen).
  const { scrollYProgress: p } = useScroll(
    pinned ? { target: ref, offset: ["start start", "end end"] } : { target: circleRef, offset: ["start end", "end start"] },
  );

  const scale = useTransform(p, [0, 0.3], [0.86, 1]);
  const yaw = useTransform(p, pinned ? [0.05, 0.95] : [0, 1], pinned ? [-0.5, 0.5] : [-0.8, 0.8]);
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

  const rise = (o: typeof titleO, y: typeof titleY) => (pinned ? { opacity: o, y } : undefined);
  // The circle's diameter. The subject comes out of the top by about a third of it, so it gets that much room.
  const d = "min(440px, 50dvh, 78vw)";

  return (
    <div ref={ref} className={pinned ? "h-[215vh]" : ""}>
      <div className={pinned ? "sticky top-0 flex h-[100dvh] items-center pt-16" : "py-16"}>
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          <div className={`lg:col-span-6 ${flip ? "lg:order-2" : ""}`}>
            <div ref={circleRef} className="relative mx-auto" style={{ width: d, marginTop: `calc(${d} * 0.3)` }}>
              <DepthRings outer={on ? ringA : undefined} inner={on ? ringB : undefined} className="pointer-events-none absolute -inset-[16%] h-[132%] w-[132%]" />
              <motion.div style={pinned && item.id !== "key-tag" ? { scale } : undefined} className="relative">
                {on && item.id === "key-tag" ? (
                  <Link href={item.href} aria-label={item.title} className="block rounded-full">
                    <KeyTagSpin yaw={yaw} zoom={pinned ? scale : undefined} />
                  </Link>
                ) : (
                  <CircleStage slides={item.stage} href={item.href} label={item.title} controls={item.stage.length > 1} />
                )}
              </motion.div>
            </div>
          </div>

          <div className={`relative z-10 lg:col-span-6 ${flip ? "lg:order-1" : ""}`}>
            <motion.h2 style={rise(titleO, titleY)} className="text-[clamp(2.75rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em]">
              {item.title}
            </motion.h2>
            {item.meta && (
              <motion.p style={rise(titleO, titleY)} className="mt-5 font-mono text-lg">
                <span style={{ color: "var(--color-accent-primary)" }}>{item.meta}</span>
              </motion.p>
            )}
            <motion.p style={rise(descO, descY)} className="mt-7 max-w-[44ch] text-lg leading-relaxed">
              <span style={muted}>{item.description}</span>
            </motion.p>
            {item.bullets && item.bullets.length > 0 && (
              <motion.ul style={rise(listO, listY)} className="mt-6 flex flex-wrap gap-y-1 text-sm">
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
