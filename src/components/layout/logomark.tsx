import { useId } from "react";

/**
 * Zenki Lab logomark (DESIGN_SYSTEM.md section 3): amber medallion, two rings
 * turning in opposite directions around a fixed Z. Outer ring is dark ink, not
 * amber, dashes at low opacity disappeared once the fill went amber. Inner ring
 * is cyan at full opacity so it doesn't blend into the fill. Motion is off
 * under reduced motion.
 */
export function Logomark({ size = 34 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-accent-primary-light)" />
          <stop offset="1" stopColor="var(--color-accent-primary)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#${gradientId})`} />
      <g className="logo-ring-outer">
        <circle cx="20" cy="20" r="17.1" stroke="var(--color-bg-primary)" strokeWidth="2" strokeDasharray="10 8" />
      </g>
      <g className="logo-ring-inner">
        <circle cx="20" cy="20" r="13.2" stroke="var(--color-accent-warm)" strokeWidth="1.3" />
      </g>
      <path d="M14.5 13.5H25.5L14.5 26.5H25.5" stroke="var(--color-bg-primary)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
