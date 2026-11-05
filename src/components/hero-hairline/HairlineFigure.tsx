"use client";

import { useEffect, useMemo, useRef } from "react";
import { mount, type Drive, type Scene } from "./render";

const REST = { az: 0, k: 0, lift: 0 };

/**
 * One Hairline scene in a 5:4 box. The server draws `scene.still`, which is
 * also the picture without JavaScript and under reduced motion; on the client
 * `drive` takes over (a loop, or a value such as scroll progress).
 */
export function HairlineFigure({
  scene, drive, label, caption = true, className = "",
}: {
  scene: Scene;
  drive: (stage: HTMLElement) => Drive;
  label: string;
  caption?: boolean;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const capRef = useRef<HTMLParagraphElement>(null);
  const poster = useMemo(() => scene.frame(scene.still, REST), [scene]);
  const driveRef = useRef(drive);

  useEffect(() => {
    const stage = stageRef.current, svg = svgRef.current;
    if (!stage || !svg) return;
    return mount(svg, scene, driveRef.current(stage), stage.closest("section") ?? stage, capRef.current);
  }, [scene]);

  return (
    <div ref={stageRef} className={`min-w-0 ${className}`}>
      <div role="img" aria-label={label} className="hl-fig relative w-full aspect-[5/4]">
        <svg ref={svgRef} viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          {poster.map((it, i) => (
            <path key={i} d={it.d} className={it.c} opacity={it.o} />
          ))}
        </svg>
      </div>
      {/* a live read-out, changing many times a second: decorative for screen readers, the label says it all */}
      {caption && scene.caption && (
        <p ref={capRef} aria-hidden="true" className="hl-cap">{scene.caption(scene.still)}</p>
      )}
    </div>
  );
}
