import Link from "next/link";
import { footerLinks, comingSoonFeatures } from "@/lib/constants";
import { Sparkles } from "lucide-react";
import { Logomark } from "./logomark";

export function Footer() {
  return (
    <footer className="border-t bg-card" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Top */}
        <div className="py-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <Logomark size={34} />
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
                      href={link.href.startsWith("#") ? `/${link.href}` : link.href}
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
          <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
            Zenki Lab is currently in its launch phase. New features and services are continuously being added as we grow.
          </p>
        </div>

        {/* Coming Soon: a plain list, none of these items needs a box */}
        <div className="py-10 border-t" style={{ borderColor: "var(--color-border)" }}>
          <h4 className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/90">
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent-warm)" }} aria-hidden="true" />
            Coming Soon
          </h4>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {comingSoonFeatures.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <feature.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-accent-warm)" }} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold mb-1 text-white/90">{feature.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            &copy; {new Date().getFullYear()} Zenki Lab. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Colombo, Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
}