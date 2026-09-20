"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Capture } from "@/components/keytag/KeyTagScene";
import {
  COMBOS,
  BRANDING_DISCOUNT,
  RFID_PRICE,
  QUOTE_HOURS,
  STORAGE_KEY,
  STYLES,
  orderSpec,
  priceLines,
  rs,
  sanitizeText,
  styleForContent,
  type ComboId,
  type ContentType,
  type KeyTagConfig,
  type StoredOrder,
  type StyleId,
} from "@/lib/keytag";

const KeyTagScene = dynamic(() => import("@/components/keytag/KeyTagScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-card" />,
});

const seg = (on: boolean) =>
  `flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
    on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
  }`;
const field =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-[color:var(--color-text-tertiary)] focus:border-primary focus:outline-none";

export default function KeyTagPage() {
  const router = useRouter();
  const captureRef = useRef<Capture | null>(null);
  const [content, setContent] = useState<ContentType>("name");
  const [style, setStyle] = useState<StyleId>("data-plate");
  const [combo, setCombo] = useState<ComboId>("heritage");
  const [text, setText] = useState("");
  const [branding, setBranding] = useState(true); // opt-out: pre-checked
  const [rfid, setRfid] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Restore when the customer came back via Edit
  useEffect(() => {
    try {
      const o: StoredOrder | null = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (o) {
        const c = o.config;
        setContent(c.content); setStyle(c.style); setCombo(c.combo); setText(c.text);
        setBranding(c.branding);
        setRfid(!!c.rfid);
        setName(o.contact.name); setPhone(o.contact.phone);
        return;
      }
    } catch {}
  }, []);

  const config: KeyTagConfig = { content, style, combo, text, branding, rfid };
  const max = STYLES[style].maxChars;
  const p = priceLines(config);

  const pickContent = (c: ContentType) => {
    const s = styleForContent(c);
    setContent(c);
    setStyle(s);
    setText((t) => sanitizeText(c, s, t));
  };
  const pickStyle = (s: StyleId) => {
    setStyle(s);
    setText((t) => sanitizeText(content, s, t));
  };

  async function submit() {
    setError("");
    if (!text.trim()) return setError("Enter the text for your tag.");
    if (!name.trim() || phone.replace(/\D/g, "").length < 9)
      return setError("Add your name and a WhatsApp number so we can reach you.");
    setBusy(true);
    try {
      const [{ buildPrintGroup }, { exportTo3MF }] = await Promise.all([
        import("@/components/keytag/geometry"),
        import("three-3mf-exporter"),
      ]);
      const cfg = { ...config, text: text.trim() };
      const blob = await exportTo3MF(buildPrintGroup(cfg), { filament: "Generic PETG" });
      const now = Date.now();
      const order: StoredOrder = {
        orderId: `KT-${now.toString(36).toUpperCase()}`,
        config: cfg,
        contact: { name: name.trim(), phone: phone.trim() },
        thumbnail: captureRef.current?.() ?? "",
        createdAt: now,
        expiresAt: now + QUOTE_HOURS * 3600_000,
      };
      const form = new FormData();
      form.append("stage", "quote");
      form.append("orderId", order.orderId);
      form.append("spec", orderSpec(order, "quote"));
      form.append("model", new File([blob], `${order.orderId}.3mf`, { type: "model/3mf" }));
      try {
        const res = await fetch("/api/hub/keytag-order", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `HTTP ${res.status}`);
      } catch (e) {
        // The Pages Function does not run under `next dev`, so let local runs continue.
        if (process.env.NODE_ENV !== "development") throw e;
        console.warn("keytag-order not sent (dev only):", e);
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      router.push("/store/key-tag/quote");
    } catch (e) {
      setError(e instanceof Error ? `Could not send your design: ${e.message}` : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-28 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Live preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card">
              <KeyTagScene config={config} flipped={flipped} captureRef={captureRef} />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button type="button" onClick={() => setFlipped(false)} className={seg(!flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Front</button>
                <button type="button" onClick={() => setFlipped(true)} className={seg(flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Back</button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Drag to rotate. Preview is the real geometry we print from.</p>
          </div>

          {/* Controls */}
          <div className="space-y-8">
            <div>
              <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Custom key tag</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Design it, see it in 3D, get a quote. Printed in Kaduwela, Sri Lanka.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">What goes on it</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => pickContent("name")} className={seg(content === "name")}>Name</button>
                <button type="button" onClick={() => pickContent("car-number")} className={seg(content === "car-number")}>Car Number</button>
              </div>
              <div>
                <input
                  className={field}
                  value={text}
                  maxLength={max}
                  onChange={(e) => setText(sanitizeText(content, style, e.target.value))}
                  placeholder={content === "name" ? "Your name" : "CAB-1234"}
                  aria-label="Tag text"
                />
                <p className="mt-1.5 text-right font-mono text-xs text-muted-foreground">{text.length}/{max}</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Style</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(STYLES) as StyleId[]).map((s) => (
                  <button key={s} type="button" onClick={() => pickStyle(s)} className={seg(style === s) + " text-left"}>
                    <span className="flex items-center justify-between">
                      {STYLES[s].label}
                      {STYLES[s].content === content && <span className="text-[10px] uppercase tracking-widest text-primary">Suggested</span>}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">{STYLES[s].blurb}</span>
                  </button>
                ))}
              </div>
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
              <p className="text-xs text-muted-foreground">Black body, one accent. Heritage is black and amber, Precision is black and cyan.</p>
            </section>

            <section className="space-y-2 rounded-xl border border-border bg-card p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={branding} onChange={(e) => setBranding(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--color-accent-primary)]" />
                <span className="text-sm">
                  Keep the zenkilab.com stamp on the back and save <span className="font-mono">{rs(BRANDING_DISCOUNT)}</span>
                </span>
              </label>
              <p className="pl-7 text-xs text-muted-foreground">Without it, the back is left blank.</p>
              <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-3">
                <input type="checkbox" checked={rfid} onChange={(e) => setRfid(e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--color-accent-primary)]" />
                <span className="text-sm">
                  Add an RFID chip inside the tag for <span className="font-mono">{rs(RFID_PRICE)}</span>
                </span>
              </label>
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
                <div className="flex justify-between"><dt className="text-muted-foreground">{STYLES[style].label}</dt><dd>{rs(p.base)}</dd></div>
                {p.discount > 0 && (
                  <div className="flex justify-between"><dt className="text-muted-foreground">Branding discount</dt><dd className="text-primary">-{rs(p.discount)}</dd></div>
                )}
                {p.rfid > 0 && (
                  <div className="flex justify-between"><dt className="text-muted-foreground">RFID chip</dt><dd>+{rs(p.rfid)}</dd></div>
                )}
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{rs(p.total)}</dd></div>
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
