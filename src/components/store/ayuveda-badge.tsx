"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CONCEPTS, DEFAULT_LOGO, type ConceptId, type Staff } from "@/lib/ayuveda-badge";

/** One line of lettering that shrinks (to 70%) until it fits its column, never wraps. */
function Fit({ text, size, width, unit, style, font }: { text: string; size: number; width: number; unit: number; style: React.CSSProperties; font: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = `${size * unit}cqw`;
    const ratio = el.clientWidth / (el.scrollWidth || 1);
    setK(Math.max(0.7, Math.min(1, ratio)));
    // a web font arriving late changes the width, so measure again once fonts settle
    document.fonts?.ready.then(() => {
      el.style.fontSize = `${size * unit}cqw`;
      setK(Math.max(0.7, Math.min(1, el.clientWidth / (el.scrollWidth || 1))));
    });
  }, [text, size, unit, font]);
  return (
    <div ref={ref} style={{ ...style, width: `${width * unit}cqw`, fontSize: `${size * unit * k}cqw`, whiteSpace: "nowrap", overflow: "hidden", lineHeight: 1.15 }}>
      {text || " "}
    </div>
  );
}

/** The badge drawn to scale. Everything is sized in cqw so it fills whatever width its parent gives it. */
export function AyuvedaBadge({ concept, staff, back, logo = DEFAULT_LOGO, font = "Inter" }: { concept: ConceptId; staff: Staff; back?: boolean; logo?: string; font?: string }) {
  const c = CONCEPTS[concept];
  const u = 100 / c.w; // cqw per mm
  return (
    <div style={{ containerType: "inline-size", width: "100%", maxWidth: 560 }}>
      <div
        style={{
          position: "relative", display: "flex", alignItems: "center",
          width: "100%", aspectRatio: `${c.w} / ${c.h}`, borderRadius: `${4 * u}cqw`,
          background: back ? (concept === "A" ? "#EFE6D6" : "#211C18") : c.body,
          boxShadow: "0 12px 28px rgba(0,0,0,.45)", fontFamily: `"${font}", Inter, sans-serif`,
        }}
      >
        {back ? (
          <>
            {c.pins.map((x) => (
              <div
                key={x}
                style={{
                  position: "absolute", top: "50%", left: `${x * u}cqw`, translate: "-50% -50%",
                  width: `${25 * u}cqw`, height: `${8 * u}cqw`, border: `1.5px dashed ${concept === "A" ? "#8A4A2B" : c.accent}`,
                  borderRadius: `${2 * u}cqw`, display: "grid", placeItems: "center", fontSize: `${2 * u}cqw`,
                  color: concept === "A" ? "#8A4A2B" : c.accent, fontFamily: "var(--font-mono), monospace",
                }}
              >
                PIN
              </div>
            ))}
            <div style={{ position: "absolute", left: "50%", bottom: `${2 * u}cqw`, translate: "-50%", fontSize: `${1.8 * u}cqw`, color: concept === "A" ? "#8A4A2B" : c.accent, whiteSpace: "nowrap", fontFamily: "var(--font-mono), monospace" }}>
              flat back, pin pockets dashed
            </div>
          </>
        ) : (
          <>
            <div
              role="img"
              aria-label="AyuVeda logo"
              style={{
                flex: "none", marginLeft: `${3 * u}cqw`, width: `${c.logo * u}cqw`, height: `${c.logo * u}cqw`, background: c.accent,
                WebkitMask: `url("${logo}") center/contain no-repeat`, mask: `url("${logo}") center/contain no-repeat`,
              }}
            />
            <div style={{ marginLeft: `${c.gap * u}cqw`, minWidth: 0, display: "grid", gap: `${0.8 * u}cqw` }}>
              <Fit font={font} text={staff.name} size={c.nameSize} width={c.textW} unit={u} style={{ color: c.name, fontWeight: 600 }} />
              <div style={{ height: `${0.7 * u}cqw`, width: `${(concept === "A" ? 10 : 8) * u}cqw`, background: c.accent, borderRadius: 2 }} />
              <Fit font={font} text={staff.role} size={c.roleSize} width={c.textW} unit={u} style={{ color: c.role, fontWeight: 500 }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
