import Link from "next/link";
import { footerLinks, comingSoonFeatures } from "@/lib/constants";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Top */}
        <div className="py-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div
                className="overflow-visible"
                style={{ perspective: "200px", width: 34, height: 34 }}
              >
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden="true"
                >
                  <style>
                    {`
                      @keyframes footerHex3d {
                        0%   { transform: rotateY(0deg); }
                        100% { transform: rotateY(-360deg); }
                      }
                      @keyframes footerZ3d {
                        0%   { transform: rotateY(360deg); }
                        100% { transform: rotateY(0deg); }
                      }
                      .fh-3d {
                        transform-origin: 20px 20px;
                        animation: footerHex3d 8s linear infinite;
                      }
                      .fz-3d {
                        transform-origin: 20px 23px;
                        animation: footerZ3d 8s linear infinite;
                      }
                    `}
                  </style>
                  <g className="fh-3d">
                    <path
                      d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                      stroke="var(--color-accent-primary)"
                      strokeWidth="1.6"
                      fill="none"
                    />
                  </g>
                  <path
                    d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                    stroke="var(--color-text-primary)"
                    strokeOpacity="0.12"
                    strokeWidth="1.6"
                    fill="none"
                    transform="scale(0.78) translate(5.7 5.7)"
                  />
                  <text
                    x="20"
                    y="26"
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="800"
                    fill="var(--color-text-primary)"
                    fontFamily="var(--font-inter), sans-serif"
                    className="fz-3d"
                  >
                    Z
                  </text>
                </svg>
              </div>
              <svg width="96" height="24" viewBox="0 0 96 24" role="img" aria-label="ZenkiLab" className="overflow-visible">
                <text x="0" y="18" fontFamily="var(--font-wordmark), sans-serif" fontSize="20" fontWeight="600" letterSpacing="-0.4">
                  <tspan fill="var(--color-text-primary)">Zenki</tspan><tspan fill="var(--color-accent-primary)">Lab</tspan>
                </text>
              </svg>
            </Link>
            <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: "var(--color-text-secondary)" }}>
              Premium custom 3D printing. Building confidence, one part at a time.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold tracking-widest uppercase mb-4 text-white/90">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-white"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Launch phase note */}
        <div className="py-6 border-t" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-sm text-center" style={{ color: "var(--color-text-tertiary)" }}>
            Zenki Lab is currently in its launch phase. New features and services are continuously being added as we grow.
          </p>
        </div>

        {/* Coming Soon */}
        <div className="py-10 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent-warm)" }} />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-secondary)" }}>
              Coming Soon
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {comingSoonFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group p-4 rounded-xl transition-all duration-300"
                style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent-warm) 20%, transparent)" }}
                >
                  <feature.icon className="w-4 h-4" style={{ color: "var(--color-accent-warm)" }} />
                </div>
                <h4 className="text-sm font-semibold mb-1 text-white/90">
                  {feature.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            &copy; {new Date().getFullYear()} Zenki Lab. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Colombo, Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
}