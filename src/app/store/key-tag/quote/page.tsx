"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { contactChannels } from "@/lib/constants";
import {
  COMBOS,
  CORNER_LABEL,
  MATERIAL,
  STORAGE_KEY,
  STYLES,
  batchPriceSummary,
  priceLines,
  rs,
  type StoredOrder,
} from "@/lib/keytag";
import { sendOrder } from "@/lib/keytag-submit";

const whatsapp = contactChannels.find((c) => c.label === "WhatsApp")?.href ?? "#";

function remaining(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export default function QuotePage() {
  const [order, setOrder] = useState<StoredOrder | null | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setOrder(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"));
    } catch {
      setOrder(null);
    }
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function confirm() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await sendOrder(order, "confirm");
      const next = { ...order, confirmed: true };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setOrder(next);
    } catch (e) {
      setError(e instanceof Error ? `Could not confirm: ${e.message}` : "Could not confirm. Please try again.");
    }
    setBusy(false);
  }

  const shell = (children: React.ReactNode) => (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-28 lg:px-8">{children}</main>
      <Footer />
    </>
  );

  if (order === undefined) return shell(null);
  if (order === null)
    return shell(
      <div className="text-center">
        <h1 className="text-3xl font-bold">No quote found</h1>
        <p className="mt-3 text-sm text-muted-foreground">Design a key tag first and we will build your quote.</p>
        <Link href="/store/key-tag" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground">Start Designing</Link>
      </div>,
    );

  const configs = order.configs && order.configs.length > 0 ? order.configs : [order.config];
  const summary = batchPriceSummary(configs);
  const c = configs[0];
  const expired = now >= order.expiresAt;

  if (order.confirmed)
    return shell(
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-bold">You are in the print queue</h1>
        <p className="mt-3 font-mono text-sm text-primary">{order.orderId}</p>
        <p className="mx-auto mt-4 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
          We will check your design{configs.length > 1 ? "s" : ""} and message you on WhatsApp at {order.contact.phone}. You have not paid anything.
          Payment happens on delivery or is confirmed over WhatsApp.
        </p>
        <a href={whatsapp} className="mt-6 inline-flex h-11 items-center rounded-xl border border-border px-6 text-sm font-medium hover:border-primary">Message Us on WhatsApp</a>
      </div>,
    );

  return shell(
    <>
      <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Your quote</h1>
      <div className="mt-2 flex items-center gap-3">
        <p className="font-mono text-xs text-muted-foreground">{order.orderId}</p>
        <span className="text-xs text-muted-foreground">•</span>
        <p className="text-xs font-semibold text-primary">
          {configs.length} {configs.length === 1 ? "Key Tag" : "Key Tags"}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {configs.length === 1 ? (
          // Single tag detail view
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              {order.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.thumbnail} alt="Your key tag design" className="h-20 w-28 rounded-lg border border-border object-cover" />
              )}
              <div>
                <p className="font-semibold">{STYLES[c.style].label}</p>
                <p className="font-mono text-sm text-primary">{c.text}</p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-border text-sm">
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">Style</dt>
                <dd className="text-right">{STYLES[c.style].label + (c.style === "ring" ? ` (${CORNER_LABEL[c.corner]} corners)` : "")}</dd>
              </div>
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">Text</dt>
                <dd className="text-right font-mono">{c.text}</dd>
              </div>
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">Colors</dt>
                <dd className="text-right">{COMBOS[c.combo].label}, black and {COMBOS[c.combo].accentName}</dd>
              </div>
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">Material</dt>
                <dd className="text-right">{MATERIAL}</dd>
              </div>
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">Back</dt>
                <dd className="text-right">{c.branding ? "Flat, with zenkilab.com as a flush inlay" : "Flat and plain"}</dd>
              </div>
              <div className="flex justify-between gap-6 py-2.5">
                <dt className="text-muted-foreground">NFC chip</dt>
                <dd className="text-right">{c.nfc ? "Included" : "No"}</dd>
              </div>
            </dl>
          </div>
        ) : (
          // Multiple tags list view
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customized Tags ({configs.length})</h2>
            <div className="grid gap-3">
              {configs.map((tag, idx) => {
                const itemPrice = priceLines(tag);
                const combo = COMBOS[tag.combo];
                return (
                  <div key={tag.id ?? idx} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-mono font-semibold text-primary">Tag #{idx + 1}</span>
                      <span className="font-mono text-sm font-semibold">{rs(itemPrice.total)}</span>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-base font-bold text-foreground">&quot;{tag.text}&quot;</p>
                        <p className="text-xs text-muted-foreground">
                          {STYLES[tag.style].label} {tag.style === "ring" ? `(${CORNER_LABEL[tag.corner]} corners)` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1">
                          <span className="h-2 w-2 rounded-full" style={{ background: combo.accent }} />
                          {combo.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted/40 px-2 py-0.5">
                        {tag.content === "name" ? "Name" : "Car Plate"}
                      </span>
                      {tag.branding && (
                        <span className="rounded bg-primary/10 text-primary px-2 py-0.5">
                          zenkilab stamp (-{rs(tag.branding ? 50 : 0)})
                        </span>
                      )}
                      {tag.nfc && (
                        <span className="rounded bg-cyan-500/10 text-cyan-400 px-2 py-0.5 font-medium">
                          NFC chip included (+Rs. 200)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Calculation Breakdown Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <dl className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Base price {configs.length > 1 ? `(${configs.length} key tags)` : `(${STYLES[c.style].label})`}
              </dt>
              <dd>{rs(summary.base)}</dd>
            </div>
            {summary.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Branding discount</dt>
                <dd className="text-primary">-{rs(summary.discount)}</dd>
              </div>
            )}
            {summary.nfc > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">NFC chips</dt>
                <dd>+{rs(summary.nfc)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-border pt-3">
              <dt>Grand Total</dt>
              <dd>{rs(summary.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className={`mt-5 text-sm ${expired ? "text-[color:var(--color-danger)]" : "text-muted-foreground"}`}>
        {expired
          ? "This quote has expired. Edit your design to get a fresh one."
          : <>This quote is valid for 24 hours, until <span className="font-mono text-foreground">{new Date(order.expiresAt).toLocaleString()}</span> ({remaining(order.expiresAt - now)} left).</>}
      </p>

      <div className="mt-6 rounded-xl border border-border p-5 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">What happens next</p>
        <p className="mt-2">
          Confirming puts your tag{configs.length > 1 ? "s" : ""} in our print queue. It does not take payment, and you have not paid anything yet.
          We check the design, message you on WhatsApp, and you pay on delivery or over WhatsApp.
        </p>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={confirm}
          disabled={busy || expired}
          className="h-12 flex-1 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)] disabled:opacity-50"
        >
          {busy ? "Adding to queue..." : `Confirm and Add to Print Queue (${rs(summary.total)})`}
        </button>
        <Link href="/store/key-tag" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium hover:border-primary">
          Edit Design
        </Link>
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        By confirming, you agree to our <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link> and{" "}
        <Link href="/refunds" className="underline underline-offset-2 hover:text-foreground">Refund Policy</Link>.
      </p>
    </>,
  );
}
