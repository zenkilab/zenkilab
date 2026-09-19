"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Materials", href: "#materials" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Store", href: "/store" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }
    const id = href.replace("#", "");
    // Defer scroll until mobile menu finishes closing (250ms animation)
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.href = "/" + href; // on a sub page, go home first
      }
    }, 300);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-[72px]">
          {/* Logo — 3D spinning hexagon + Z */}
          <Link href="/" className="flex items-center gap-2.5 group">
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
                    @keyframes hex3dLeft {
                      0%   { transform: rotateY(0deg); }
                      100% { transform: rotateY(-360deg); }
                    }
                    @keyframes z3dRight {
                      0%   { transform: rotateY(360deg); }
                      100% { transform: rotateY(0deg); }
                    }
                    .hex-3d {
                      transform-origin: 20px 20px;
                      animation: hex3dLeft 8s linear infinite;
                    }
                    .z-3d {
                      transform-origin: 20px 23px;
                      animation: z3dRight 8s linear infinite;
                    }
                  `}
                </style>

                {/* Outer hexagon — spins left (counter-clockwise in 3D) */}
                <g className="hex-3d">
                  <path
                    d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="1.6"
                    fill="none"
                  />
                </g>

                {/* Inner hexagon — stationary */}
                <path
                  d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                  stroke="var(--color-text-primary)"
                  strokeOpacity="0.12"
                  strokeWidth="1.6"
                  fill="none"
                  transform="scale(0.78) translate(5.7 5.7)"
                />

                {/* Z character — spins right (clockwise in 3D) */}
                <text
                  x="20"
                  y="26"
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="var(--color-text-primary)"
                  fontFamily="var(--font-inter), sans-serif"
                  className="z-3d"
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

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Menu Button (hamburger) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-md text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border/60 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                  className="block px-3 py-3 text-sm font-medium rounded-md text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}