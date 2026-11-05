"use client";

import { useEffect, useRef } from "react";
import { STATIC_T, frame, mount } from "./gearbox";

// The finished, running gearbox: rendered on the server, so it is the picture without JS and under reduced motion.
const POSTER = frame(STATIC_T);

export function GearboxFigure({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return mount(svg, svg.closest("section") ?? svg.parentElement ?? svg as unknown as HTMLElement);
  }, []);

  return (
    <div
      role="img"
      aria-label="Line drawing of an illustrative open gearbox: two meshing gears on shafts are sketched, designed, their housing 3D printed layer by layer, then assembled and turning."
      className={`hl-fig relative w-full aspect-[5/4] ${className}`}
    >
      <svg ref={svgRef} viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        {POSTER.map((it, i) => (
          <path key={i} d={it.d} className={it.c} opacity={it.o} />
        ))}
      </svg>
    </div>
  );
}
