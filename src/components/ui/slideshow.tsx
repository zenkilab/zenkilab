"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";

export type Slide = { src: string; alt: string };

const FADE_MS = 900;

/**
 * Shared slideshow behaviour.
 * - Soft crossfade with a slow push-in on the photo that is showing.
 * - The outgoing photo keeps its zoom while it fades, and pausing freezes the zoom in place,
 *   so nothing snaps back.
 * - Does not autoplay under reduced motion, holds on hover and keyboard focus, and waits
 *   while the tab is hidden.
 */
export function useSlideshow(n: number, interval = 3000) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const idxRef = useRef(0);
  const playing = !reduce && !userPaused && !hold && n > 1;

  const go = (next: number) => {
    const to = ((next % n) + n) % n;
    if (to === idxRef.current) return;
    setPrev(idxRef.current);
    idxRef.current = to;
    setIdx(to);
  };

  useEffect(() => {
    if (!playing) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (document.visibilityState === "visible") go(idxRef.current + 1);
      else t = setTimeout(tick, 500);
    };
    t = setTimeout(tick, interval);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, playing, interval]);

  /** Style for the layer holding slide i. Use the same call for every layer of a slide. */
  const layer = (i: number, origin = "50% 50%"): CSSProperties => {
    const active = i === idx;
    const showing = active || i === prev;
    return {
      opacity: active ? 1 : 0,
      zIndex: active ? 2 : 0,
      transition: `opacity ${FADE_MS}ms ease`,
      transformOrigin: origin,
      animationName: showing && !reduce ? "slideshow-push" : "none",
      animationDuration: `${interval + FADE_MS}ms`,
      animationTimingFunction: "linear",
      animationFillMode: "both",
      animationPlayState: playing ? "running" : "paused",
    };
  };

  const holdProps = {
    onMouseEnter: () => setHold(true),
    onMouseLeave: () => setHold(false),
    onFocusCapture: () => setHold(true),
    onBlurCapture: () => setHold(false),
  };

  return { idx, go, layer, holdProps, userPaused, setUserPaused, reduce: !!reduce };
}

export function SlideControls({
  n,
  idx,
  go,
  userPaused,
  setUserPaused,
  reduce,
  dots = true,
}: {
  n: number;
  idx: number;
  go: (i: number) => void;
  userPaused: boolean;
  setUserPaused: (fn: (p: boolean) => boolean) => void;
  reduce: boolean;
  dots?: boolean;
}) {
  if (n < 2) return null;
  return (
    <div className="mt-3 flex items-center gap-1">
      <button
        type="button"
        onClick={() => setUserPaused((p) => !p)}
        aria-label={userPaused || reduce ? "Play slideshow" : "Pause slideshow"}
        aria-pressed={userPaused}
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/5 motion-reduce:transition-none"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {userPaused || reduce ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
      {dots &&
        Array.from({ length: n }, (_, i) => (
          <button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1} of ${n}`} aria-current={i === idx} className="flex h-11 w-7 items-center justify-center">
            <span
              className="block h-[3px] rounded-full transition-all duration-500 motion-reduce:transition-none"
              style={{ width: i === idx ? 24 : 12, backgroundColor: i === idx ? "var(--color-accent-primary)" : "var(--color-border-light)" }}
            />
          </button>
        ))}
    </div>
  );
}

/** Rectangular slideshow: subject-cropped photos, fade and push-in. */
export function Slideshow({
  slides,
  interval = 3000,
  href,
  label,
  frameClassName = "rounded-2xl",
  aspect = "4 / 5",
  controls = true,
  className,
}: {
  slides: Slide[];
  interval?: number;
  href?: string;
  label?: string;
  frameClassName?: string;
  aspect?: string;
  controls?: boolean;
  className?: string;
}) {
  const s = useSlideshow(slides.length, interval);
  const frame = (
    <div className={`relative h-full w-full overflow-hidden ${frameClassName}`} style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}>
      {slides.map((sl, i) => (
        <div key={sl.src} aria-hidden={i !== s.idx} className="absolute inset-0" style={s.layer(i)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sl.src} alt={sl.alt} decoding="async" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
  return (
    <div className={className}>
      <div className="w-full" style={{ aspectRatio: aspect }} {...s.holdProps}>
        {href ? (
          <Link href={href} aria-label={label} className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {frame}
          </Link>
        ) : (
          frame
        )}
      </div>
      {controls && <SlideControls n={slides.length} idx={s.idx} go={s.go} userPaused={s.userPaused} setUserPaused={s.setUserPaused} reduce={s.reduce} />}
    </div>
  );
}
