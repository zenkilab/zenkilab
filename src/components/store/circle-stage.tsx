"use client";

import Link from "next/link";
import { SlideControls, useSlideshow } from "@/components/ui/slideshow";
import type { StageBox, StageSlide } from "@/lib/stage";

/**
 * A hard circle for the background with the subject allowed to come out of it: the photo is
 * clipped to the circle, and a cut-out of the subject is drawn on top, unclipped, in exactly
 * the same place. Both layers fade and push in together.
 */
export function CircleStage({
  slides,
  interval = 3000,
  href,
  label,
  controls = true,
  className,
}: {
  slides: StageSlide[];
  interval?: number;
  href?: string;
  label?: string;
  controls?: boolean;
  className?: string;
}) {
  const s = useSlideshow(slides.length, interval);
  const origin = "50% 92%"; // grow from the base of the subject
  const imgStyle = (b: StageBox) => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.w}%` });

  const stage = (
    <div className="relative aspect-square w-full">
      {/*
       * The photos are shot on a near-black studio background, so a plain hairline border reads
       * as invisible against them: the circle disappears and the subject popping out of it (the
       * unclipped cut layer below) has no edge to visibly cross. A soft glow ring, painted outside
       * the circle by box-shadow (not clipped by this element's own overflow-hidden), gives the
       * eye a boundary regardless of how dark the photo is.
       */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-light)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-accent-warm) 45%, transparent), 0 0 32px -6px color-mix(in srgb, var(--color-accent-warm) 40%, transparent)",
        }}
      >
        {slides.map((sl, i) => (
          <div key={sl.bg} aria-hidden={i !== s.idx} className="absolute inset-0" style={s.layer(i, origin)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sl.bg} alt={sl.alt} decoding="async" className="absolute max-w-none" style={imgStyle(sl.box)} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {slides.map((sl, i) =>
          sl.cut ? (
            <div key={sl.cut} className="absolute inset-0" style={s.layer(i, origin)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sl.cut} alt="" decoding="async" className="absolute max-w-none" style={imgStyle(sl.box)} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div {...s.holdProps}>
        {href ? (
          <Link href={href} aria-label={label} className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {stage}
          </Link>
        ) : (
          stage
        )}
      </div>
      {controls && slides.length > 1 && <SlideControls n={slides.length} idx={s.idx} go={s.go} userPaused={s.userPaused} setUserPaused={s.setUserPaused} reduce={s.reduce} />}
    </div>
  );
}
