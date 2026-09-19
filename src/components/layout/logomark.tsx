/**
 * Zenki Lab logomark (DESIGN_SYSTEM.md section 3): two rings turning in opposite
 * directions around a fixed Z. Amber outer ring (dashed, counter-clockwise, 10s),
 * cyan inner ring (solid, clockwise, 7s). Motion is off under reduced motion.
 */
export function Logomark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className="shrink-0">
      <g className="logo-ring-outer">
        <circle cx="20" cy="20" r="18" stroke="var(--color-accent-primary)" strokeOpacity="0.45" strokeWidth="1.6" strokeDasharray="10 8" />
      </g>
      <g className="logo-ring-inner">
        <circle cx="20" cy="20" r="13.5" stroke="var(--color-accent-warm)" strokeOpacity="0.45" strokeWidth="1.6" />
      </g>
      <path d="M14.5 13.5H25.5L14.5 26.5H25.5" stroke="var(--color-text-primary)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
