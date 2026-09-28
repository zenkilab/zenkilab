"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Logomark } from "./logomark";
import { contactChannels } from "@/lib/constants";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Materials", href: "#materials" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const whatsappHref = contactChannels.find((c) => c.label === "WhatsApp")!.href;

/* Official WhatsApp glyph, matches the icon already used in the contact section */
function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982 1.005-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
        fill="var(--color-accent-warm)"
      />
    </svg>
  );
}

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
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-[72px]">
          {/* Logomark + wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logomark size={34} />
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
            <Link
              href="/store"
              className="ml-2 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-accent-primary)] text-[#1a1200] hover:bg-[var(--color-accent-primary-light)] transition-colors duration-200"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Store
            </Link>
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

    {/* Mobile floating action buttons: WhatsApp above Store, both pulled out of the hamburger for visibility */}
    <div className="lg:hidden fixed z-50 right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-12 h-12 rounded-full bg-background border border-border/60 shadow-lg flex items-center justify-center"
      >
        <WhatsAppIcon />
      </a>
      <Link
        href="/store"
        aria-label="Visit Store"
        className="w-14 h-14 rounded-full bg-[var(--color-accent-primary)] text-[#1a1200] shadow-lg flex items-center justify-center"
      >
        <ShoppingBag className="w-6 h-6" />
      </Link>
    </div>
    </>
  );
}