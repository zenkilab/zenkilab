"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { services } from "@/lib/constants";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function ServicesSection() {
  return (
    <section id="services" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-14 lg:mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            What We Print
          </span>
          <h2
            className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]"
            style={{ color: "var(--color-text-primary)" }}
          >
            We print custom parts.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            From automotive components to household items and custom gifts. If
            you have a 3D model, we can manufacture it.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {services.map((service) => (
            <motion.a
              key={service.title}
              href={service.href}
              variants={item}
              className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-[2px]"
              style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
            >
              {/* ── Image container: 16:9, rounded-top, gradient overlay ── */}
              <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out"
                  style={{ transform: "scale(1)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
                  }}
                />
                {/* Gradient fade to card surface */}
                <div
                  className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
                  style={{
                    background: "linear-gradient(to top, var(--color-bg-surface) 0%, color-mix(in srgb, var(--color-bg-surface) 60%, transparent) 50%, transparent 100%)",
                  }}
                />
              </div>

              {/* ── Card content — pulled up to overlap image ── */}
              <div className="relative p-7 lg:p-8" style={{ marginTop: "-24px" }}>
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-warm) 8%, transparent)" }}
                >
                  <service.icon className="w-5 h-5 transition-colors duration-300" style={{ color: "var(--color-accent-warm)" }} />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold mb-2 tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  {service.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {service.examples.map((ex) => (
                    <span
                      key={ex}
                      className="text-[11px] px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {ex}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-300"
                  style={{ color: "var(--color-accent-primary)" }}
                >
                  Start a Project
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}