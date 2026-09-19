"use client";

import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { materials } from "@/lib/constants";

export function MaterialsSection() {
  return (
    <section id="materials" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-14 lg:mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            Materials
          </span>
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
            The right material for your project.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            We'll help you choose. From everyday PLA to carbon fibre
            composites — there's a material that fits your application.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material, idx) => (
            <motion.div
              key={material.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
              className="group relative rounded-2xl p-8 lg:p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="absolute top-0 left-6 right-6 h-[2px] rounded-full transition-all duration-500 group-hover:left-2 group-hover:right-2"
                style={{ backgroundColor: material.color }}
              />
              <div className="flex items-center gap-3 mb-4 mt-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: material.color }} />
                <h3 className="text-xl font-bold tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
                  {material.name}
                </h3>
              </div>
              <p className="text-sm leading-relaxed mb-7" style={{ color: "var(--color-text-secondary)" }}>
                {material.description}
              </p>
              <div className="space-y-3">
                {material.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                    >
                      <stat.icon className="w-3.5 h-3.5" style={{ color: "var(--color-accent-warm)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                        {stat.label}
                      </p>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shrinkage — subtle engineering detail */}
              {material.shrinkage && (
                <div className="mt-5 pt-4 flex items-center gap-2.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <Ruler className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
                  <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                    Shrinkage: <span style={{ color: "var(--color-text-secondary)" }}>{material.shrinkage}</span>
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}