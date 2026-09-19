"use client";

import { useState } from "react";
import { ProductLayout } from "@/components/store/product-layout";
import { CHIBI_SIZES, chibiDeposit, chibiMessage, whatsappLink } from "@/lib/store";
import { rs } from "@/lib/keytag";

const steps = [
  ["Pay a 50% deposit", "This starts your order. Payment is arranged over WhatsApp after you tap the button. Nothing is charged on this website."],
  ["We generate your model", "We create the 3D figure with Meshy AI from your reference photos."],
  ["You approve it", "We send you the model. Nothing is printed until you say yes."],
  ["Pay the balance, then we print", "The remaining 50% is due before printing starts."],
];

export default function ChibiFigurePage() {
  const [sizeId, setSizeId] = useState(CHIBI_SIZES[0].id);
  const size = CHIBI_SIZES.find((s) => s.id === sizeId)!;
  const deposit = size.price === null ? null : chibiDeposit(size.price);

  return (
    <ProductLayout
      image="/store/chibi-figure-hero.webp"
      alt="Close-up of a white 3D printed chibi figure with round glasses, lit in blue"
      focus="center 30%"
    >
      <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Chibi Figure</h1>
      <p className="mt-3 font-mono text-lg" style={{ color: "var(--color-accent-primary)" }}>From {rs(CHIBI_SIZES[0].price!)}</p>
      <p className="mt-5 max-w-[52ch] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        A small stylised figure of a person, generated with Meshy AI and printed at Zenki Lab. You see and approve the 3D model before anything is printed.
      </p>

      <fieldset className="mt-8">
        <legend className="mb-3 text-sm font-semibold">Size</legend>
        <div className="flex gap-3">
          {CHIBI_SIZES.map((s) => (
            <label key={s.id} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="size"
                value={s.id}
                checked={sizeId === s.id}
                onChange={() => setSizeId(s.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-14 flex-col justify-center rounded-xl border border-border px-4 py-2 transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring motion-reduce:transition-none">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{s.approx}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>Sizes are approximate.</p>
      </fieldset>

      <dl className="mt-8 space-y-2 border-t border-border pt-6 font-mono text-sm">
        {size.price === null ? (
          <div className="flex justify-between gap-6">
            <dt style={{ color: "var(--color-text-secondary)" }}>Price</dt>
            <dd>Confirmed on WhatsApp</dd>
          </div>
        ) : (
          <>
            <div className="flex justify-between"><dt style={{ color: "var(--color-text-secondary)" }}>Price</dt><dd>{rs(size.price)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Deposit now (50%)</dt><dd>{rs(deposit!)}</dd></div>
            <div className="flex justify-between"><dt style={{ color: "var(--color-text-secondary)" }}>Balance before printing</dt><dd>{rs(size.price - deposit!)}</dd></div>
          </>
        )}
      </dl>

      <a
        href={whatsappLink(chibiMessage(size))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
      >
        {deposit === null ? "Ask for the Large price" : `Pay Deposit (${rs(deposit)})`}
      </a>
      <p className="mt-3 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Opens WhatsApp with your order filled in. No payment is taken on this website.
      </p>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-4 list-decimal space-y-4 pl-5" style={{ color: "var(--color-text-secondary)" }}>
          {steps.map(([title, body]) => (
            <li key={title} className="pl-1">
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{title}. </span>
              {body}
            </li>
          ))}
        </ol>
      </section>
    </ProductLayout>
  );
}
