"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Capture } from "@/components/keytag/KeyTagScene";
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from "lucide-react";
import {
  COMBOS,
  CORNER_LABEL,
  BRANDING_DISCOUNT,
  NFC_PRICE,
  QUOTE_HOURS,
  STORAGE_KEY,
  STYLES,
  batchPriceSummary,
  createDefaultKeyTag,
  priceLines,
  rs,
  sanitizeText,
  type ComboId,
  type ContentType,
  type Corner,
  type KeyTagConfig,
  type StoredOrder,
  type StyleId,
} from "@/lib/keytag";
import { sendOrder } from "@/lib/keytag-submit";

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

// Corner roundness, shown as a picture and a plain word, never a millimetre number.
const CORNER_ICON: Record<Corner, number> = { sharp: 2, soft: 6, round: 10 };
const CORNERS: Corner[] = ["sharp", "soft", "round"];

function CornerIcon({ r }: { r: number }) {
  return (
    <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true">
      <rect x="2" y="2" width="30" height="18" rx={r} fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export default function KeyTagPage() {
  const router = useRouter();
  const captureRef = useRef<Capture | null>(null);
  const textRef = useRef<HTMLInputElement>(null);

  // Multiple key tags state
  const [tags, setTags] = useState<KeyTagConfig[]>([createDefaultKeyTag()]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [flipped, setFlipped] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [textError, setTextError] = useState(false);

  // Restore when the customer came back via Edit
  useEffect(() => {
    try {
      const o: StoredOrder | null = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (o) {
        if (Array.isArray(o.configs) && o.configs.length > 0) {
          setTags(
            o.configs.map((c) => ({
              ...c,
              text: sanitizeText(c.content, c.style, c.text),
            })),
          );
        } else if (o.config) {
          const c = o.config;
          setTags([
            {
              ...c,
              text: sanitizeText(c.content, c.style, c.text),
            },
          ]);
        }
        setName(o.contact?.name ?? "");
        setPhone(o.contact?.phone ?? "");
      }
    } catch {}
  }, []);

  const safeIndex = Math.max(0, Math.min(activeIndex, tags.length - 1));
  const activeTag = tags[safeIndex] ?? tags[0];
  const max = STYLES[activeTag.style].maxChars;
  const activeEmpty = !activeTag.text.trim();
  const sample = activeTag.content === "name" ? "Your name" : "CAB-1234";
  // Only flag the field while the tag on screen is still empty, not after switching to a filled one.
  const showTextError = textError && activeEmpty;
  // Tags left without text are drafts: skipped in the price and the order.
  const filled = tags.filter((t) => t.text.trim());
  const summary = batchPriceSummary(filled.length ? filled : [activeTag]);
  const count = summary.count;

  const updateActiveTag = (patch: Partial<KeyTagConfig>) => {
    setTags((prev) =>
      prev.map((t, i) => (i === safeIndex ? { ...t, ...patch } : t)),
    );
  };

  const pickContent = (c: ContentType) => {
    updateActiveTag({
      content: c,
      text: sanitizeText(c, activeTag.style, activeTag.text),
    });
  };

  const pickStyle = (s: StyleId) => {
    updateActiveTag({
      style: s,
      text: sanitizeText(activeTag.content, s, activeTag.text),
    });
  };

  const pickCorner = (c: Corner) => {
    updateActiveTag({ corner: c });
  };

  const pickCombo = (combo: ComboId) => {
    updateActiveTag({ combo });
  };

  const updateText = (val: string) => {
    setTextError(false);
    updateActiveTag({
      text: sanitizeText(activeTag.content, activeTag.style, val),
    });
  };

  const toggleBranding = (checked: boolean) => {
    updateActiveTag({ branding: checked });
  };

  const toggleNfc = (checked: boolean) => {
    updateActiveTag({ nfc: checked });
  };

  // Carousel controls with wrap-around
  const prevTag = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : tags.length - 1));
  };

  const nextTag = () => {
    setActiveIndex((prev) => (prev < tags.length - 1 ? prev + 1 : 0));
  };

  const selectTag = (index: number) => {
    if (index >= 0 && index < tags.length) {
      setActiveIndex(index);
    }
  };

  // Plain focus() leaves the field under the fixed header when it is only just off-screen.
  const focusText = () => {
    textRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textRef.current?.focus({ preventScroll: true });
  };

  const addTag = () => {
    // Don't stack blank tags: finish the current one first.
    if (activeEmpty) {
      setTextError(true);
      return focusText();
    }
    const newTag = createDefaultKeyTag();
    // Inherit sensible styling defaults from the active tag
    newTag.style = activeTag.style;
    newTag.corner = activeTag.corner;
    newTag.combo = activeTag.combo;
    newTag.branding = activeTag.branding;
    setTags((prev) => [...prev, newTag]);
    setActiveIndex(tags.length);
    // The text field sits above this button; take the customer straight to it.
    requestAnimationFrame(focusText);
  };

  const duplicateTag = () => {
    const clone: KeyTagConfig = {
      ...activeTag,
      id: `kt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setTags((prev) => [...prev, clone]);
    setActiveIndex(tags.length);
  };

  const removeTag = (indexToRemove: number) => {
    if (tags.length <= 1) return;
    setTags((prev) => prev.filter((_, i) => i !== indexToRemove));
    setActiveIndex((prev) => Math.max(0, Math.min(prev, tags.length - 2)));
  };

  async function submit() {
    setError("");
    setTextError(false);
    // Rebuilt here rather than reusing `filled`: the React Compiler lint misreads that as render-time work.
    const cleanTags = tags.filter((t) => t.text.trim()).map((t) => ({ ...t, text: t.text.trim() }));
    if (!cleanTags.length) {
      setTextError(true);
      return focusText();
    }
    if (!name.trim() || phone.replace(/\D/g, "").length < 9) {
      return setError("Add your name and a WhatsApp number so we can reach you.");
    }
    setBusy(true);
    try {
      const { buildOrder3MF } = await import("@/components/keytag/export3mf");
      const blob = await buildOrder3MF(cleanTags);
      const now = Date.now();
      // The scene shows the active tag. If that one is blank (skipped), show the first real tag so the preview isn't empty.
      if (activeEmpty) {
        setActiveIndex(tags.findIndex((t) => t.text.trim()));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      const currentCapture = captureRef.current?.() ?? "";

      const order: StoredOrder = {
        orderId: `KT-${now.toString(36).toUpperCase()}`,
        config: cleanTags[0],
        configs: cleanTags,
        contact: { name: name.trim(), phone: phone.trim() },
        thumbnail: currentCapture,
        thumbnails: [currentCapture],
        createdAt: now,
        expiresAt: now + QUOTE_HOURS * 3600_000,
      };

      await sendOrder(order, "quote", blob);
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
          {/* Live preview in picture / carousel mode */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card [&_canvas]:!touch-pan-y shadow-sm">
              {/* Active tag indicator badge */}
              <div className="absolute left-3 top-3 z-10 flex max-w-[80%] items-center gap-2 rounded-full border border-border/80 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="font-semibold shrink-0">Tag {safeIndex + 1} of {tags.length}</span>
                {activeTag.text ? (
                  <span className="font-mono text-primary truncate">&quot;{activeTag.text}&quot;</span>
                ) : (
                  <span className="text-muted-foreground italic">sample, type yours</span>
                )}
              </div>

              {/* 3D Scene for the currently active key tag */}
              <KeyTagScene config={activeTag} flipped={flipped} captureRef={captureRef} sample={activeEmpty ? sample : undefined} />

              {/* VERY BIG ARROWS: Left and Right carousel navigation */}
              {tags.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevTag}
                    aria-label="Previous key tag"
                    title="Previous key tag"
                    className="absolute left-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border/80 bg-background/90 text-foreground shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:border-primary hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <ChevronLeft className="h-8 w-8 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={nextTag}
                    aria-label="Next key tag"
                    title="Next key tag"
                    className="absolute right-3 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border/80 bg-background/90 text-foreground shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:border-primary hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <ChevronRight className="h-8 w-8 stroke-[2.5]" />
                  </button>
                </>
              )}

              {/* Flip controls: Front / Back */}
              <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFlipped(false)}
                  className={seg(!flipped) + " !flex-none !px-3 !py-1.5 bg-background/70 backdrop-blur-sm"}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className={seg(flipped) + " !flex-none !px-3 !py-1.5 bg-background/70 backdrop-blur-sm"}
                >
                  Back
                </button>
              </div>

              {/* Pagination indicators in carousel */}
              {tags.length > 1 && (
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1.5 backdrop-blur-md">
                  {tags.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectTag(i)}
                      aria-label={`Jump to tag ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === safeIndex ? "w-5 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick tag selector strip underneath preview */}
            {tags.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {tags.map((t, idx) => (
                  <button
                    key={t.id ?? idx}
                    type="button"
                    onClick={() => selectTag(idx)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                      idx === safeIndex
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                        : "border-border bg-card/70 text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <span>Tag #{idx + 1}</span>
                    <span className="font-mono text-foreground font-semibold">
                      {t.text ? t.text : <span className="text-muted-foreground italic font-normal">empty</span>}
                    </span>
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ background: COMBOS[t.combo].accent }}
                      title={COMBOS[t.combo].label}
                    />
                  </button>
                ))}
              </div>
            )}

            <p className="mt-2.5 text-xs text-muted-foreground">
              Drag to rotate. Preview is the real geometry we print from. {tags.length > 1 ? "Use the big arrows to flip through your designs." : ""}
            </p>
          </div>

          {/* Customization controls */}
          <div className="space-y-8">
            <div>
              <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Custom key tag</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Design one or multiple tags, see them in real 3D, and get a quote. Printed in Kaduwela, Sri Lanka.
              </p>
            </div>

            {/* What goes on it */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">What goes on {tags.length > 1 ? `tag #${safeIndex + 1}` : "it"}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => pickContent("name")} className={seg(activeTag.content === "name")}>
                  Name
                </button>
                <button type="button" onClick={() => pickContent("car-number")} className={seg(activeTag.content === "car-number")}>
                  Car Number
                </button>
              </div>
              <div>
                <input
                  ref={textRef}
                  className={field + (showTextError ? " !border-[color:var(--color-danger)]" : "")}
                  value={activeTag.text}
                  maxLength={max}
                  onChange={(e) => updateText(e.target.value)}
                  placeholder={sample}
                  aria-label="Tag text"
                  aria-invalid={showTextError}
                  aria-describedby={showTextError ? "tag-text-error" : undefined}
                />
                <div className="mt-1.5 flex justify-between gap-3 text-xs">
                  <p id="tag-text-error" role="alert" className="text-[color:var(--color-danger)]">
                    {showTextError && "Type the text you want printed on this tag."}
                  </p>
                  <p className="font-mono text-muted-foreground">{activeTag.text.length}/{max}</p>
                </div>
              </div>
            </section>

            {/* Shape section for active tag */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Shape</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => pickStyle("ring")} className={seg(activeTag.style === "ring")}>
                  Ring tag
                  <span className="block text-xs font-normal opacity-70">up to {STYLES.ring.maxChars} letters</span>
                </button>
                <button type="button" onClick={() => pickStyle("capsule")} className={seg(activeTag.style === "capsule")}>
                  Capsule tag
                  <span className="block text-xs font-normal opacity-70">up to {STYLES.capsule.maxChars} letters</span>
                </button>
              </div>
              {activeTag.style === "ring" && (
                <div className="flex gap-2 pt-1">
                  {CORNERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCorner(c)}
                      className={seg(activeTag.corner === c) + " flex flex-col items-center gap-1.5 !py-2"}
                    >
                      <CornerIcon r={CORNER_ICON[c]} />
                      {CORNER_LABEL[c]}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Colors */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Colors</h3>
              <div className="flex gap-2">
                {(Object.keys(COMBOS) as ComboId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickCombo(id)}
                    className={seg(activeTag.combo === id) + " flex items-center justify-center gap-2"}
                  >
                    <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: COMBOS[id].body }} />
                    <span className="h-3 w-3 rounded-full" style={{ background: COMBOS[id].accent }} />
                    {COMBOS[id].label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Black body, one accent. Heritage is black and amber, Precision is black and cyan.</p>
            </section>

            {/* Options */}
            <section className="space-y-2 rounded-xl border border-border bg-card p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={activeTag.branding}
                  onChange={(e) => toggleBranding(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[color:var(--color-accent-primary)]"
                />
                <span className="text-sm">
                  Keep the zenkilab.com stamp on the back and save <span className="font-mono">{rs(BRANDING_DISCOUNT)}</span>
                </span>
              </label>
              <p className="pl-7 text-xs text-muted-foreground">The back is always flat. Without the stamp it is left plain.</p>
              <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-3">
                <input
                  type="checkbox"
                  checked={activeTag.nfc}
                  onChange={(e) => toggleNfc(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[color:var(--color-accent-primary)]"
                />
                <span className="text-sm">
                  Add an NFC chip inside the tag for <span className="font-mono">{rs(NFC_PRICE)}</span>
                </span>
              </label>
            </section>

            {/* More tags: comes after the tag is designed, so the flow reads design → add another → details */}
            <section className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-medium uppercase tracking-wider text-primary">
                    {tags.length > 1 ? `Tag #${safeIndex + 1} of ${tags.length}` : "Need more tags?"}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {tags.length > 1
                      ? "Use the arrows or the strip under the preview to switch tags."
                      : "Each tag can have its own text, shape and colors."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTag(safeIndex)}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
                      title="Remove this tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={duplicateTag}
                    disabled={activeEmpty}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    title="Duplicate this tag with same settings"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={addTag}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/60 bg-primary/10 px-4 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Add Another Key Tag
              </button>
              {tags.length > 1 && (
                <p className="text-center text-xs text-muted-foreground">
                  Empty tags are skipped when you get your quote.
                </p>
              )}
            </section>

            {/* Customer Contact details */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Your details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
                <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel" aria-label="WhatsApp number" />
              </div>
            </section>

            {/* Pricing Summary */}
            <section className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Quote Summary ({count} {count === 1 ? "tag" : "tags"})
                </h3>
              </div>

              {tags.length > 1 && (
                <div className="max-h-40 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/80 bg-card/40 p-3 text-xs font-mono">
                  {tags.map((t, i) => {
                    const empty = !t.text.trim();
                    return (
                      <button
                        key={t.id ?? i}
                        type="button"
                        onClick={() => selectTag(i)}
                        className={`flex w-full items-center justify-between py-1.5 text-left transition-colors hover:text-primary ${
                          i === safeIndex ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        <span className={empty ? "italic opacity-70" : ""}>
                          #{i + 1} {empty ? "empty, skipped" : `"${t.text}"`} ({STYLES[t.style].label.split(" ")[0]})
                        </span>
                        <span>{empty ? "—" : rs(priceLines(t).total)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <dl className="space-y-1.5 font-mono text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Base price {count > 1 ? `(${count} tags)` : `(${STYLES[(filled[0] ?? activeTag).style].label})`}
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
                <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
                  <dt>Grand Total</dt>
                  <dd>{rs(summary.total)}</dd>
                </div>
              </dl>

              {error && <p role="alert" className="text-sm text-[color:var(--color-danger)]">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)] disabled:opacity-60"
              >
                {busy
                  ? "Preparing your print files..."
                  : count > 1
                    ? `Get My Quote (${count} Tags · ${rs(summary.total)})`
                    : "Get My Quote"}
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
