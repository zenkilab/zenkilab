"use client";

import { useEffect, useRef } from "react";

/**
 * ═══════════════════════════════════════════════════════
 * Printer Build Sequence — scroll-driven SVG animation
 *
 * Animates a blueprint-style 3D printer illustration layer-by-layer
 * as the visitor scrolls toward the Quote CTA.
 *
 * Animation timeline (0 → 1 scroll progress):
 *   0–15%:   Section opacity 0 → 1 (fade in)
 *   15–45%:  #toolhead translateX moves right
 *   45–60%:  #bed translateY moves down
 *   45–90%:  #print reveals via clipPath height
 *   90–100%: Cross-fade: printer section out, quote section in
 *
 * Respects prefers-reduced-motion: renders fully drawn, no scroll listeners.
 * ═══════════════════════════════════════════════════════
 */

const TOOLHEAD_TRAVEL = 28; // px travel distance (desktop)
const BED_TRAVEL = 6; // px bed drop

export function PrinterAnimationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const toolheadRef = useRef<SVGGElement>(null);
  const bedRef = useRef<SVGGElement>(null);
  const printClipRef = useRef<SVGClipPathElement>(null);
  const printClipRectRef = useRef<SVGRectElement>(null);
  const quoteRef = useRef<HTMLElement | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    /* ═══════════════════════════════════════════════════
       Bail out if user prefers reduced motion —
       render fully visible, no scroll animation.
       ══════════════════════════════════════════════════ */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* Show everything fully drawn */
      if (sectionRef.current) {
        sectionRef.current.style.opacity = "1";
      }
      if (printClipRectRef.current) {
        printClipRectRef.current.setAttribute("height", "44");
      }
      return;
    }

    /* Find #quote section for cross-fade at 90-100% */
    quoteRef.current = document.getElementById("quote");

    /* ═══════════════════════════════════════════════════
       IntersectionObserver — only run math when section
       is near the viewport (rootMargin: ±50% of viewport).
       ══════════════════════════════════════════════════ */
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          startScrollLoop();
        } else {
          stopScrollLoop();
        }
      },
      { threshold: 0 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    /* ── Scroll progress calculator ── */
    const getProgress = (): number => {
      const section = sectionRef.current;
      if (!section) return 0;

      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      /* How far has the user scrolled *into* the section?
         0 = section top just entered viewport bottom
         1 = section bottom just left viewport top */
      const startPoint = viewportHeight; // section top at bottom of viewport
      const endPoint = -sectionHeight; // section bottom at top of viewport

      const raw = (startPoint - sectionTop) / (startPoint - endPoint);
      return Math.max(0, Math.min(1, raw));
    };

    /* ── Animation application ── */
    const applyProgress = (t: number) => {
      const toolhead = toolheadRef.current;
      const bed = bedRef.current;
      const clipRect = printClipRectRef.current;
      const sectionEl = sectionRef.current;
      const quoteEl = quoteRef.current;

      /*
       * Step 1: 0–15% → section opacity 0 → 1
       */
      const fadeIn = Math.max(0, Math.min(1, t / 0.15));
      if (sectionEl) {
        sectionEl.style.opacity = String(fadeIn);
      }

      /*
       * Step 2: 15–45% → toolhead translateX
       */
      let toolheadX = 0;
      if (t > 0.15) {
        const t2 = Math.max(0, Math.min(1, (t - 0.15) / 0.3));
        /* ease-out quad */
        const eased = 1 - (1 - t2) * (1 - t2);
        toolheadX = eased * TOOLHEAD_TRAVEL;
      }
      if (toolhead) {
        toolhead.style.transform = `translateX(${toolheadX}px)`;
      }

      /*
       * Step 3: 45–60% → bed translateY down
       */
      let bedY = 0;
      if (t > 0.45) {
        const t3 = Math.max(0, Math.min(1, (t - 0.45) / 0.15));
        /* ease-out quad */
        const eased = 1 - (1 - t3) * (1 - t3);
        bedY = eased * BED_TRAVEL;
      }
      if (bed) {
        bed.style.transform = `translateY(${bedY}px)`;
      }

      /*
       * Step 4: 45–90% → print clipPath height reveal
       */
      if (clipRect) {
        const fullHeight = 44; // matches SVG rect height
        let clipH = 0;
        if (t > 0.45) {
          const t4 = Math.max(0, Math.min(1, (t - 0.45) / 0.45));
          clipH = t4 * fullHeight;
        }
        clipRect.setAttribute("height", String(clipH));
      }

      /*
       * Step 5: 90–100% → cross-fade printer out, quote in
       */
      if (t > 0.9) {
        const t5 = Math.max(0, Math.min(1, (t - 0.9) / 0.1));
        if (sectionEl) {
          sectionEl.style.opacity = String(1 - t5);
        }
        if (quoteEl) {
          quoteEl.style.setProperty(
            "--quote-crossfade-opacity",
            String(t5)
          );
        }
      } else {
        if (sectionEl) {
          sectionEl.style.opacity = String(fadeIn);
        }
        if (quoteEl) {
          quoteEl.style.setProperty("--quote-crossfade-opacity", "0");
        }
      }
    };

    /* ── rAF scroll loop ── */
    const scrollLoop = () => {
      const progress = getProgress();
      applyProgress(progress);
      rafId.current = requestAnimationFrame(scrollLoop);
    };

    const startScrollLoop = () => {
      if (rafId.current) return; // already running
      rafId.current = requestAnimationFrame(scrollLoop);
    };

    const stopScrollLoop = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };

    return () => {
      observer.disconnect();
      stopScrollLoop();
    };
  }, []);

  return (
    <section
      id="printer-animation"
      ref={sectionRef}
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Blueprint background grid */}
      <div className="printer-blueprint-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 max-w-[960px] mx-auto px-6 lg:px-12 text-center">
        {/* Section label */}
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--color-accent-primary)] mb-8 block">
          Build Sequence
        </span>

        {/* Printer SVG illustration */}
        <div className="relative max-w-[520px] mx-auto aspect-[4/3] flex items-center justify-center">
          <svg
            id="printer-illustration"
            ref={svgRef}
            width="520"
            height="390"
            viewBox="0 0 520 390"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* ═══ Frame — enclosure box ═══ */}
            <g id="frame">
              {/* Outer enclosure */}
              <rect
                className="printer-outline"
                x="80"
                y="50"
                width="340"
                height="240"
                rx="8"
                strokeWidth="1.5"
              />
              {/* Top lid line */}
              <path
                className="printer-accent"
                d="M80 70 L420 70"
                strokeWidth="1"
              />
              {/* Base accent line */}
              <path
                className="printer-accent"
                d="M100 270 L400 270"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </g>

            {/* ═══ Doors — transparent front panels ═══ */}
            <g id="doors">
              {/* Left door */}
              <rect
                className="printer-outline"
                x="80"
                y="50"
                width="170"
                height="240"
                rx="8"
                strokeWidth="1"
                strokeDasharray="6 3"
              />
              {/* Right door */}
              <rect
                className="printer-outline"
                x="250"
                y="50"
                width="170"
                height="240"
                rx="8"
                strokeWidth="1"
                strokeDasharray="6 3"
              />
              {/* Door handles */}
              <path
                className="printer-accent"
                d="M240 160 L240 180"
                strokeWidth="1.5"
              />
              <path
                className="printer-accent"
                d="M260 160 L260 180"
                strokeWidth="1.5"
              />
            </g>

            {/* ═══ Gantry — rails and guides ═══ */}
            <g id="gantry">
              {/* Top horizontal rail */}
              <path
                className="printer-outline"
                d="M100 80 L400 80"
                strokeWidth="1.5"
              />
              {/* Bottom horizontal rail */}
              <path
                className="printer-outline"
                d="M100 260 L400 260"
                strokeWidth="1.5"
              />
              {/* Left vertical rail */}
              <path
                className="printer-accent"
                d="M120 80 L120 260"
                strokeWidth="1.2"
              />
              {/* Right vertical rail */}
              <path
                className="printer-accent"
                d="M380 80 L380 260"
                strokeWidth="1.2"
              />
              {/* X-axis crossbar (connects two vertical rails, toolhead rides this) */}
              <path
                className="printer-accent"
                d="M120 110 L380 110"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
            </g>

            {/* ═══ Toolhead — the print head on X-axis ═══ */}
            <g id="toolhead" ref={toolheadRef}>
              {/* Toolhead housing */}
              <rect
                className="printer-outline"
                x="220"
                y="96"
                width="30"
                height="24"
                rx="3"
                strokeWidth="1.5"
              />
              {/* Nozzle */}
              <path
                className="printer-accent"
                d="M232 120 L232 130 L234 130 L234 120"
                strokeWidth="1.2"
              />
              {/* Heatsink fins */}
              <path
                className="printer-outline"
                d="M226 98 L226 106"
                strokeWidth="0.8"
              />
              <path
                className="printer-outline"
                d="M232 98 L232 106"
                strokeWidth="0.8"
              />
              <path
                className="printer-outline"
                d="M238 98 L238 106"
                strokeWidth="0.8"
              />
              {/* Fan shroud outline */}
              <circle
                className="printer-accent"
                cx="228"
                cy="108"
                r="5"
                strokeWidth="0.8"
              />
            </g>

            {/* ═══ Bed — print platform ═══ */}
            <g id="bed" ref={bedRef}>
              {/* Bed surface */}
              <rect
                className="printer-outline"
                x="140"
                y="200"
                width="220"
                height="6"
                rx="1"
                strokeWidth="1.2"
              />
              {/* Bed grid lines */}
              <path
                className="printer-outline"
                d="M180 200 L180 206"
                strokeWidth="0.6"
              />
              <path
                className="printer-outline"
                d="M220 200 L220 206"
                strokeWidth="0.6"
              />
              <path
                className="printer-outline"
                d="M260 200 L260 206"
                strokeWidth="0.6"
              />
              <path
                className="printer-outline"
                d="M300 200 L300 206"
                strokeWidth="0.6"
              />
              {/* Bed support bracket */}
              <path
                className="printer-accent"
                d="M160 206 L160 230 L340 230 L340 206"
                strokeWidth="0.8"
              />
            </g>

            {/* ═══ Print — the object being printed (clipPath reveal) ═══ */}
            <g id="print">
              <defs>
                <clipPath id="print-clip" ref={printClipRef}>
                  <rect
                    ref={printClipRectRef}
                    x="220"
                    y="154"
                    width="60"
                    height="44"
                    fill="white"
                  />
                </clipPath>
              </defs>
              {/* Printed object — abstract geometric shape */}
              <g clipPath="url(#print-clip)">
                {/* Base platform */}
                <rect
                  className="printer-accent-fill"
                  x="220"
                  y="192"
                  width="60"
                  height="6"
                  rx="1"
                />
                {/* Column */}
                <rect
                  className="printer-accent-fill"
                  x="238"
                  y="164"
                  width="24"
                  height="28"
                  rx="2"
                />
                {/* Top cap */}
                <rect
                  className="printer-accent-fill"
                  x="230"
                  y="154"
                  width="40"
                  height="14"
                  rx="3"
                />
                {/* Outlines on top of fills for print shape */}
                <rect
                  className="printer-outline"
                  x="220"
                  y="192"
                  width="60"
                  height="6"
                  rx="1"
                />
                <rect
                  className="printer-outline"
                  x="238"
                  y="164"
                  width="24"
                  height="28"
                  rx="2"
                />
                <rect
                  className="printer-outline"
                  x="230"
                  y="154"
                  width="40"
                  height="14"
                  rx="3"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Caption */}
        <p className="text-sm mt-8 max-w-[440px] mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Every project is built layer by layer — precision from the first line
          to the final surface.
        </p>
      </div>
    </section>
  );
}