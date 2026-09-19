"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/constants";
import { CrossfadeShowcase } from "@/components/ui/crossfade-showcase";

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

        <CrossfadeShowcase
          aspect="4 / 3"
          items={services.map((service) => ({
            id: service.title,
            title: service.title,
            description: service.description,
            bullets: service.examples,
            href: service.href,
            cta: "Start a Project",
            image: service.image,
            alt: service.title,
            icon: service.icon,
          }))}
        />
      </div>
    </section>
  );
}