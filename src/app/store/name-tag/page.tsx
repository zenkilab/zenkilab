"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MATERIAL } from "@/lib/keytag";
import dynamic from "next/dynamic";
import {
  ACCENTS, CONCEPTS, DEFAULT_LOGO, FONTS, MAX_NAME, MAX_ROLE, SAMPLE_STAFF, THICKNESS, approvalMessage, readLogo, sanitizeLine,
  type ConceptId, type FontId, type Staff,
} from "@/lib/name-tag";

const NameTagScene = dynamic(() => import("@/components/store/name-tag-scene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-card" />,
});

const seg = (on: boolean) =>
  `flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
    on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
  }`;
const field =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-[color:var(--color-text-tertiary)] focus:border-primary focus:outline-none";

export default function NameTagPage() {
  const [concept, setConcept] = useState<ConceptId>("A");
  const [staff, setStaff] = useState<Staff[]>(SAMPLE_STAFF);
  const [sel, setSel] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [logoName, setLogoName] = useState("Sample logo");
  const [logoError, setLogoError] = useState("");
  const [font, setFont] = useState<FontId>("Inter");
  const [accent, setAccent] = useState<string>(ACCENTS[0].hex);
  const [site, setSite] = useState("");
  const [found, setFound] = useState<{ name: string; available: boolean }[]>([]);
  const [siteBusy, setSiteBusy] = useState(false);
  const [siteMsg, setSiteMsg] = useState("");

  // Fonts read from the company website, offered next to the built-in ones.
  const fontOptions = [
    ...found.filter((f) => f.available).map((f) => ({ id: f.name, note: "From your website" })),
    ...FONTS.filter((f) => !found.some((x) => x.available && x.name === f.id)),
  ];

  async function findFonts() {
    if (!site.trim()) return;
    setSiteBusy(true);
    setSiteMsg("");
    try {
      const res = await fetch(`/api/site-fonts?url=${encodeURIComponent(site.trim())}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || "Could not read that website.");
      setFound(data.fonts);
      const first = data.fonts.find((f: { available: boolean }) => f.available);
      if (first) setFont(first.name);
      setSiteMsg(
        data.fonts.length === 0
          ? "No fonts found on that site. Pick one below."
          : first
            ? `Found ${data.fonts.map((f: { name: string }) => f.name).join(", ")}.${data.fonts.some((f: { available: boolean }) => !f.available) ? " Fonts that are not on Google Fonts cannot be used, so the closest option is shown." : ""}`
            : `Found ${data.fonts.map((f: { name: string }) => f.name).join(", ")}, but none can be used here. Pick the closest one below.`,
      );
    } catch (e) {
      setSiteMsg(e instanceof Error ? e.message : "Could not read that website.");
    } finally {
      setSiteBusy(false);
    }
  }

  // Each font loads from Google Fonts once picked.
  useEffect(() => {
    const id = `gf-${font}`;
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@500;600&display=swap`;
    document.head.appendChild(l);
  }, [font]);

  async function pickLogo(file?: File) {
    if (!file) return;
    setLogoError("");
    try {
      setLogo(await readLogo(file));
      setLogoName(file.name);
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Could not use that file.");
    }
  }

  const c = CONCEPTS[concept];
  const edit = (i: number, patch: Partial<Staff>) => setStaff((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => {
    setStaff((s) => s.filter((_, j) => j !== i));
    setSel((n) => Math.max(0, Math.min(n, staff.length - 2)));
  };
  const add = () => {
    setStaff((s) => [...s, { name: "", role: "" }]);
    setSel(staff.length);
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-28 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Live preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card [&_canvas]:!touch-pan-y">
              <NameTagScene concept={concept} staff={staff[sel] ?? { name: "", role: "" }} flipped={flipped} logo={logo} font={font} accent={accent} />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button type="button" onClick={() => setFlipped(false)} className={seg(!flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Front</button>
                <button type="button" onClick={() => setFlipped(true)} className={seg(flipped) + " !flex-none !px-3 !py-1.5 bg-background/60"}>Back</button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Drag to rotate. Drawn to scale at {c.w} × {c.h} mm. Pin positions are placeholders until the pin-back size is confirmed.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-8">
            <div>
              <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Name tag</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A light pin-on name tag with your logo, name and role, printed in Kaduwela, Sri Lanka.
                Pick a look, add your logo, check every name and title, then approve.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Design</h3>
              <div className="flex gap-2">
                {(Object.keys(CONCEPTS) as ConceptId[]).map((id) => (
                  <button key={id} type="button" onClick={() => setConcept(id)} className={seg(concept === id) + " flex items-center justify-center gap-2"}>
                    <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: id === "A" ? "#F3EBDD" : "#25201C" }} />
                    {id === "A" ? "Ivory" : "Charcoal"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                {ACCENTS.map((a) => (
                  <button key={a.id} type="button" onClick={() => setAccent(a.hex)} className={seg(accent === a.hex) + " flex items-center justify-center gap-2 !px-2"}>
                    <span className="h-3 w-3 rounded-full" style={{ background: a.hex }} />
                    {a.id}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{c.label}. {c.blurb} {c.filaments}.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Logo</h3>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{logoName}</span>
                <span className="shrink-0 font-medium text-primary">Upload Logo</span>
                <input type="file" accept="image/png,image/webp,image/svg+xml" className="sr-only" aria-label="Upload a logo"
                  onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {logoError && <p role="alert" className="text-sm text-[color:var(--color-danger)]">{logoError}</p>}
              <p className="text-xs text-muted-foreground">PNG, WebP or SVG with a transparent background, up to 2 MB. It prints in one colour, so a single-colour logo works best. Lines thinner than 0.5 mm on the badge will not print cleanly.</p>
              {logo !== DEFAULT_LOGO && (
                <button type="button" onClick={() => { setLogo(DEFAULT_LOGO); setLogoName("Sample logo"); setLogoError(""); }} className="text-xs text-muted-foreground hover:text-foreground">Use the sample logo again</button>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Lettering</h3>
              <div className="flex gap-2">
                <input className={field} value={site} onChange={(e) => setSite(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findFonts()}
                  placeholder="Company website, e.g. example.com" inputMode="url" aria-label="Company website" />
                <button type="button" onClick={findFonts} disabled={siteBusy || !site.trim()} className="h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-medium text-primary transition-colors hover:border-primary disabled:opacity-60">
                  {siteBusy ? "Looking..." : "Find Fonts"}
                </button>
              </div>
              {siteMsg && <p role="status" className="text-xs text-muted-foreground">{siteMsg}</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {fontOptions.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFont(f.id)} className={seg(font === f.id) + " text-left"} style={{ fontFamily: `"${f.id}", sans-serif` }}>
                    {f.id}
                    <span className="block text-xs font-normal text-muted-foreground">{f.note}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Staff ({staff.length})</h3>
              <ul className="space-y-3">
                {staff.map((s, i) => (
                  <li key={i} className={`space-y-2 rounded-xl border p-3 ${i === sel ? "border-primary" : "border-border"}`}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className={field} value={s.name} maxLength={MAX_NAME} onFocus={() => setSel(i)}
                        onChange={(e) => edit(i, { name: sanitizeLine(e.target.value, MAX_NAME) })} placeholder="Name" aria-label={`Name ${i + 1}`} />
                      <input className={field} value={s.role} maxLength={MAX_ROLE} onFocus={() => setSel(i)}
                        onChange={(e) => edit(i, { role: sanitizeLine(e.target.value, MAX_ROLE) })} placeholder="Role" aria-label={`Role ${i + 1}`} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <button type="button" onClick={() => setSel(i)} className="hover:text-foreground">{i === sel ? "Showing in preview" : "Show in preview"}</button>
                      {staff.length > 1 && <button type="button" onClick={() => remove(i)} className="hover:text-foreground">Remove</button>}
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={add} className={seg(false) + " w-full"}>Add Staff Member</button>
              <p className="text-xs text-muted-foreground">Names up to {MAX_NAME} letters and roles up to {MAX_ROLE}. Long text shrinks to fit, down to a readable minimum.</p>
            </section>

            <section className="space-y-3 border-t border-border pt-6">
              <dl className="space-y-1.5 font-mono text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Size</dt><dd>{c.w} × {c.h} mm</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Thickness</dt><dd>{THICKNESS} mm</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Material</dt><dd>{MATERIAL}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Corners</dt><dd>4 mm radius</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Back</dt><dd>Flat, 2 pin-backs</dd></div>
              </dl>
              <a
                href={approvalMessage(concept, staff, accent)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color:var(--color-accent-primary-light)]"
              >
                Approve Design
              </a>
              <p className="text-center text-xs text-muted-foreground">Opens WhatsApp with your choices filled in. Nothing is printed or charged until we confirm.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
