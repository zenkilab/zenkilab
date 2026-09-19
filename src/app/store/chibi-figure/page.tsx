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

const muted = { color: "var(--color-text-secondary)" };

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
      <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold leading-[1] tracking-[-0.03em]">Chibi Figure</h1>
      <p className="mt-5 font-mono text-xl" style={{ color: "var(--color-accent-primary)" }}>
        From {rs(CHIBI_SIZES[0].price!)}
      </p>
      <p className="mt-6 max-w-[46ch] leading-relaxed" style={muted}>
        A small stylised figure of a person, generated with Meshy AI and printed at Zenki Lab. You see and approve the 3D model before anything is printed.
      </p>

      <fieldset className="mt-10">
        <legend className="mb-3 text-sm font-semibold">Size</legend>
        <div className="grid grid-cols-2 gap-3">
          {CHIBI_SIZES.map((s) => (
            <label key={s.id} className="cursor-pointer">
              <input
                type="radio"
                name="size"
                value={s.id}
                checked={sizeId === s.id}
                onChange={() => setSizeId(s.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-16 flex-col justify-center rounded-xl border border-border px-5 py-3 transition-colors duration-300 hover:border-[color:var(--color-border-light)] peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring motion-reduce:transition-none">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-xs" style={muted}>{s.approx}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs" style={muted}>Sizes are approximate.</p>
      </fieldset>

      <dl className="mt-10 space-y-3 border-t border-border pt-7 font-mono text-sm">
        {size.price === null ? (
          <div className="flex justify-between gap-6">
            <dt style={muted}>Price</dt>
            <dd>Confirmed on WhatsApp</dd>
          </div>
        ) : (
          <>
            <div className="flex justify-between"><dt style={muted}>Price</dt><dd>{rs(size.price)}</dd></div>
            <div className="flex justify-between text-lg font-semibold"><dt>Deposit now (50%)</dt><dd>{rs(deposit!)}</dd></div>
            <div className="flex justify-between"><dt style={muted}>Balance before printing</dt><dd>{rs(size.price - deposit!)}</dd></div>
          </>
        )}
      </dl>

      <a
        href={whatsappLink(chibiMessage(size))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-[color:var(--color-accent-primary-light)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
      >
        {deposit === null ? "Ask for the Large Price" : `Pay Deposit (${rs(deposit)})`}
      </a>
      <p className="mt-3 text-center text-xs" style={muted}>
        Opens WhatsApp with your order filled in. No payment is taken on this website.
      </p>

      <section className="mt-14 border-t border-border pt-9">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-2 divide-y divide-border">
          {steps.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[2rem_1fr] gap-3 py-5">
              <span className="pt-0.5 font-mono text-sm" style={{ color: "var(--color-accent-primary)" }}>{i + 1}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-relaxed" style={muted}>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </ProductLayout>
  );
}
