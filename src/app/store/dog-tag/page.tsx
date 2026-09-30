"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Capture } from "@/components/dogtag/DogTagScene";
import {
  COMBOS,
  INTRO_PRICE,
  PRICE,
  QUOTE_HOURS,
  STORAGE_KEY,
  rs,
  sanitizeCollarWidth,
  sanitizePetName,
  sanitizePhone,
  type ComboId,
  type DogTagConfig,
  type StoredDogTagOrder,
} from "@/lib/dogtag";
import { sendOrder } from "@/lib/dogtag-submit";

const DogTagScene = dynamic(() => import("@/components/dogtag/DogTagScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-card" />,
});

const seg = (on: boolean) =>
  `flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
    on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
  }`;
const field =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-[color:var(--color-text-tertiary)] focus:border-primary focus:outline-none";

export default function DogTagPage() {
  const router = useRouter();
  const captureRef = useRef<Capture | null>(null);
  const [collarWidthMm, setCollarWidthMm] = useState(20);
  const [collarWidthText, setCollarWidthText] = useState("20");
  const [petName, setPetName] = useState("");
  const [tagPhone, setTagPhone] = useState("");
  const [combo, setCombo] = useState<ComboId>("heritage");
  const [showText, setShowText] = useState(true); // opt-out: pre-checked, it's the low-tech fallback
  const [flipped, setFlipped] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const o: StoredDogTagOrder | null = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (o) {
        const c = o.config;
        setCollarWidthMm(c.collarWidthMm); setCollarWidthText(String(c.collarWidthMm));
        setPetName(c.petName); setTagPhone(c.phone); setCombo(c.combo); setShowText(c.showText);
        setName(o.contact.name); setPhone(o.contact.phone);
      }
    } catch {}
  }, []);

  const config: DogTagConfig = { collarWidthMm, phone: tagPhone, petName, combo, showText };

  async function submit() {
    setError("");
    if (sanitizePhone(tagPhone).replace(/\D/g, "").length < 9)
      return setError("Add the phone number to put on the tag (QR + NFC + visible).");
    if (!name.trim() || phone.replace(/\D/g, "").length < 9)
      return setError("Add your name and a WhatsApp number so we can reach you.");
    setBusy(true);
    try {
      const { buildOrder3MF } = await import("@/components/dogtag/export3mf");
      const cfg = { ...config, petName: sanitizePetName(petName), phone: sanitizePhone(tagPhone) };
      const blob = await buildOrder3MF(cfg);
      const now = Date.now();
      const order: StoredDogTagOrder = {
        orderId: `DT-${now.toString(36).toUpperCase()}`,
        config: cfg,
        contact: { name: name.trim(), phone: phone.trim() },
        thumbnail: captureRef.current?.() ?? "",
        createdAt: now,
        expiresAt: now + QUOTE_HOURS * 3600_000,
      };
      await sendOrder(order, "quote", blob);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      router.push("/store/dog-tag/quote");
    } catch (e) {
      setError(e instanceof Error ? `Could not send your design: ${e.message}` : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-28 lg:px-8">
        <div className="mb-10 max-w-[70ch]">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-accent-primary)" }}>
            Why this exists
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This one started with a phone call, not a spec sheet. A friend&rsquo;s father, a lifelong dog
            person, told us about someone he knew who lost his dog and never got him back. We built this
            tag so that doesn&rsquo;t have to happen twice: whoever finds your dog doesn&rsquo;t need to know
            what NFC or RFID even is, just tap a phone to the tag, or scan the code, and it calls you.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card [&_canvas]:!touch-pan-y">
              <DogTagScene config={config} flipped={flipped} captureRef={captureRef} />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button type="button" onClick={() => setFlipped(false)} className={seg(!flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Front (visible when worn)</button>
                <button type="button" onClick={() => setFlipped(true)} className={seg(flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Back (against the collar)</button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Drag to rotate. Preview is the real geometry we print from.</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Dog tag</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Slides onto the collar itself, no dangling ring. An NFC chip and an embossed QR code both
                call you directly, and the number is printed right on the visible face too. Printed in
                ASA for outdoor durability.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Collar width</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className={field + " max-w-[140px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"}
                  value={collarWidthText}
                  min={10}
                  max={60}
                  onChange={(e) => {
                    setCollarWidthText(e.target.value);
                    const n = Number(e.target.value);
                    if (e.target.value.trim() !== "" && Number.isFinite(n)) setCollarWidthMm(n);
                  }}
                  onBlur={() => {
                    const clamped = sanitizeCollarWidth(Number(collarWidthText));
                    setCollarWidthMm(clamped);
                    setCollarWidthText(String(clamped));
                  }}
                  aria-label="Exact collar width in millimetres"
                />
                <span className="text-sm text-muted-foreground">mm, measure the collar&rsquo;s width for an exact fit</span>
              </div>
              <p className="text-xs text-muted-foreground">Standard sizing: Small ~15mm &middot; Medium ~20mm &middot; Large ~25mm &middot; XL ~32mm</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">On the tag</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  value={petName}
                  maxLength={14}
                  onChange={(e) => setPetName(sanitizePetName(e.target.value))}
                  placeholder="Pet's name (optional)"
                  aria-label="Pet's name"
                />
                <input
                  className={field}
                  value={tagPhone}
                  onChange={(e) => setTagPhone(e.target.value)}
                  placeholder="Phone number for the tag"
                  inputMode="tel"
                  aria-label="Phone number to put on the tag"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This number always goes on the NFC chip and the QR code. Whoever finds your dog taps or
                scans it to call you directly.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--color-accent-primary)]" />
                <span className="text-sm">
                  Also print the name and number on the visible face, readable without a phone
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Recommended: anyone who doesn&rsquo;t know to tap or scan can still call you. Turn this
                    off if you&rsquo;d rather the number wasn&rsquo;t visible at a glance, QR and NFC only.
                  </span>
                </span>
              </label>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Colors</h3>
              <div className="flex gap-2">
                {(Object.keys(COMBOS) as ComboId[]).map((id) => (
                  <button key={id} type="button" onClick={() => setCombo(id)} className={seg(combo === id) + " flex items-center justify-center gap-2"}>
                    <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: COMBOS[id].body }} />
                    <span className="h-3 w-3 rounded-full" style={{ background: COMBOS[id].accent }} />
                    {COMBOS[id].label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Your details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
                <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel" aria-label="WhatsApp number" />
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-6">
              <dl className="space-y-1.5 font-mono text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dog tag (NFC + QR + printed number)</dt>
                  <dd className="text-muted-foreground line-through">{rs(PRICE)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Introductory price</dt>
                  <dd style={{ color: "var(--color-accent-primary)" }}>{rs(INTRO_PRICE)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{rs(INTRO_PRICE)}</dd></div>
              </dl>
              {error && <p role="alert" className="text-sm text-[color:var(--color-danger)]">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)] disabled:opacity-60"
              >
                {busy ? "Preparing your print file..." : "Get My Quote"}
              </button>
              <p className="text-center text-xs text-muted-foreground">No payment now. You review the quote first.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
