"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { contactChannels } from "@/lib/constants";
import { COMBOS, MATERIAL, STORAGE_KEY, STYLES, orderSpec, priceLines, rs, type StoredOrder } from "@/lib/keytag";

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
      const form = new FormData();
      form.append("stage", "confirm");
      form.append("orderId", order.orderId);
      form.append("spec", orderSpec(order, "confirm"));
      try {
        const res = await fetch("/api/hub/keytag-order", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `HTTP ${res.status}`);
      } catch (e) {
        if (process.env.NODE_ENV !== "development") throw e;
        console.warn("keytag confirm not sent (dev only):", e);
      }
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
        <Link href="/store/key-tag" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground">Start designing</Link>
      </div>,
    );

  const { config: c } = order;
  const p = priceLines(c);
  const combo = COMBOS[c.combo];
  const expired = now >= order.expiresAt;

  const specs: [string, string][] = [
    ["Style", STYLES[c.style].label],
    ["Text", c.text],
    ["Colors", `${combo.label}, black and ${combo.accentName}`],
    ["Material", MATERIAL],
    ["Back", c.branding ? "zenkilab.com stamp" : "Blank"],
  ];

  if (order.confirmed)
    return shell(
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-bold">You are in the print queue</h1>
        <p className="mt-3 font-mono text-sm text-primary">{order.orderId}</p>
        <p className="mx-auto mt-4 max-w-[480px] text-sm leading-relaxed text-muted-foreground">
          We will check your design and message you on WhatsApp at {order.contact.phone}. You have not paid anything.
          Payment happens on delivery or is confirmed over WhatsApp.
        </p>
        <a href={whatsapp} className="mt-6 inline-flex h-11 items-center rounded-xl border border-border px-6 text-sm font-medium hover:border-primary">Message us on WhatsApp</a>
      </div>,
    );

  return shell(
    <>
      <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Your quote</h1>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{order.orderId}</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
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
          {specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 py-2.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>

        <dl className="mt-6 space-y-2 border-t border-border pt-5 font-mono text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">{STYLES[c.style].label}</dt><dd>{rs(p.base)}</dd></div>
          {p.discount > 0 && (
            <div className="flex justify-between"><dt className="text-muted-foreground">Branding discount</dt><dd className="text-primary">-{rs(p.discount)}</dd></div>
          )}
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{rs(p.total)}</dd></div>
        </dl>
      </div>

      <p className={`mt-5 text-sm ${expired ? "text-[color:var(--color-cta)]" : "text-muted-foreground"}`}>
        {expired
          ? "This quote has expired. Edit your design to get a fresh one."
          : <>This quote is valid for 24 hours, until <span className="font-mono text-foreground">{new Date(order.expiresAt).toLocaleString()}</span> ({remaining(order.expiresAt - now)} left).</>}
      </p>

      <div className="mt-6 rounded-xl border border-border p-5 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">What happens next</p>
        <p className="mt-2">
          Confirming puts your tag in our print queue. It does not take payment, and you have not paid anything yet.
          We check the design, message you on WhatsApp, and you pay on delivery or over WhatsApp.
        </p>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-[color:var(--color-cta)]">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={confirm}
          disabled={busy || expired}
          className="h-12 flex-1 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)] disabled:opacity-50"
        >
          {busy ? "Adding to queue..." : "Confirm and add to print queue (no payment now)"}
        </button>
        <Link href="/store/key-tag" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium hover:border-primary">
          Edit design
        </Link>
      </div>
    </>,
  );
}
