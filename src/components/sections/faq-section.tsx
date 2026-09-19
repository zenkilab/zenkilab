"use client";

import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { faqs } from "@/lib/constants";

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[960px] mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-14 lg:mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            FAQ
          </span>
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
            Questions? We've got answers.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Clear, honest answers about how we work.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
              className={`border rounded-2xl transition-all duration-300 ${
                openIdx === idx
                  ? "border-primary/20 bg-card"
                  : "border-border bg-card hover:border-[color:var(--color-border-light)]"
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold pr-4" style={{ color: "var(--color-text-primary)" }}>
                  {faq.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openIdx === idx
                      ? "border-primary/30 bg-[color-mix(in srgb, var(--color-accent-primary) 8%, transparent)]"
                      : "border-border"
                  }`}
                  style={openIdx === idx ? { color: "var(--color-accent-primary)" } : { color: "var(--color-text-tertiary)" }}
                >
                  {openIdx === idx ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIdx === idx ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}