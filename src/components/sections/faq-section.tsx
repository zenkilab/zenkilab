"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { faqs } from "@/lib/constants";

// A divided list, not a stack of boxes: the questions are peers, none needs elevation.
export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[960px] mx-auto px-6 lg:px-8">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
          Questions? We&apos;ve got answers.
        </h2>
        <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Clear, honest answers about how we work.
        </p>

        <ul className="mt-12 divide-y border-y lg:mt-16" style={{ borderColor: "var(--color-border)" }}>
          {faqs.map((faq, idx) => {
            const open = openIdx === idx;
            return (
              <li key={faq.question} style={{ borderColor: "var(--color-border)" }}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${idx}`}
                    aria-expanded={open}
                    aria-controls={`faq-a-${idx}`}
                    onClick={() => setOpenIdx(open ? null : idx)}
                    className="flex min-h-14 w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {faq.question}
                    </span>
                    {open ? (
                      <Minus className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-primary)" }} aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-secondary)" }} aria-hidden="true" />
                    )}
                  </button>
                </h3>
                {open && (
                  <div
                    id={`faq-a-${idx}`}
                    role="region"
                    aria-labelledby={`faq-q-${idx}`}
                    className="animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none"
                  >
                    <p className="max-w-[70ch] pb-6 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
