# Zenki Lab — UI/UX Design System (Master Reference)

Single source of truth for the website's design decisions. Update this file when a decision changes rather than re-deriving it from chat history.

---

## 1. Color

**Two-tone system: amber dominant, cyan restrained secondary.**

| Role | Token | Value |
|---|---|---|
| Background | `--color-bg-primary` | `#0B0D10` |
| Panel / surface | `--color-bg-surface` | `#12151A` / `#181C22` |
| Text primary | `--color-text-primary` | `#F3F5F7` |
| Text muted | `--color-text-secondary` | `#8A93A0` |
| **Amber — primary, dominant** | `--color-accent-primary` | `#C49B3C` base, `#D9AF52` light |
| Cyan — restrained secondary | `--color-accent-warm` (legacy token name, holds cyan) | `#22D3EE` |
| CTA (separate from brand accents) | `--color-cta` | `#EF4444` |

**Rules:**
- Amber leads everywhere: nav, primary buttons, brand mark, primary UI.
- Cyan is scoped to small precision/tech details only — icons, minor rim accents, the hologram element in the hero. Never primary nav/CTA.
- Gradients always go **light to base**, e.g. `#D9AF52 → #C49B3C`. Never base to dark (e.g. never `#C49B3C → #8a6f2a`) — that reads muddy, not premium.
- Token names in `globals.css` are historical (`--color-accent-warm` holds cyan, not a warm color) — documented with comments in the file, not renamed, to avoid touching ~70 references.

---

## 2. Typography

Three-tier system, each font has one job, none of them overlap:

- **Space Grotesk (weight 600/700)**: the wordmark ("Zenki Lab" logo text), and now also H1/H2 headings site-wide. Anywhere the page is making a statement rather than explaining something.
- **Inter**: body copy, paragraphs, nav links, buttons, form labels. Stays quiet and readable, carries no personality on purpose, that is Space Grotesk's job.
- **IBM Plex Mono**: prices, stats, specs, anything numeric. Already proven in the quote calculator and the homepage stats strip, unchanged.

This replaces the earlier "wordmark only, don't touch headings" restriction, that was correct while the decision was still open, it is now closed.

No em dash characters anywhere in site copy, reads as AI-generated. Use periods, commas, or restructure the sentence instead.

---

## 3. Logo

**Logomark:** abstract "Z" precision mark — two rings rotating in opposite directions around a fixed white Z.
- Outer ring: amber `#C49B3C`, opacity 0.45, dashed (`10 8`), rotates counter-clockwise, 10s
- Inner ring: cyan `#22D3EE`, opacity 0.45, solid, rotates clockwise, 7s
- Z: white `#FFFFFF`, stroke-width 3.4, rounded caps/joins, fixed (does not rotate)
- ViewBox `0 0 40 40`

**Wordmark:** "ZenkiLab", fully merged, no gap, one continuous word. "Zenki" white, "Lab" amber, color break is the only separation between them. Implemented as a single SVG text element with two tspans and zero dx offset, not two separate positioned text elements, that approach was fragile and caused the spacing bugs seen earlier.

Already implemented in `header.tsx` and `favicon.svg` (rings/Z only — wordmark font not yet updated there, see Section 2).

---

## 4. Layout Patterns

**Pinned-photo, scrolling-text** (Story section on homepage): one photo stays fixed via `position: sticky` while story paragraphs scroll past beside it. One photo, not a gallery.

**Fixed-column crossfade** (Services page, Store listing page): one image column stays in place; its content crossfades between items as the visitor scrolls through or hovers the corresponding text block. Reused across Services and Store because both have the same content shape — several items, each with a description.

**Product detail pages (Store):** one large, dramatic, close-up hero image, no thumbnail rail (deliberately removed). Purchase panel on the other side: rating, title, description, trust badges, relevant customization controls, quantity, price, primary action button. Real routing (`/store/[slug]`), not client-state toggling.

**Quotation / order confirmation page:** shown after a customer finishes customizing and clicks the primary CTA. Contains: design recap (small thumbnail + summary), itemized spec list, price breakdown as separate line items (not just a final number), a "what happens next" note, a visible quote expiry (e.g. 24 hours), and Confirm + Edit actions. Clarify explicitly whether Confirm collects payment or just locks the order into the queue — don't leave that ambiguous in the UI copy.

---

## 5. Key Tag Product — Specific Rules

- **Material: PETG only.** Not offered as a customer choice (removes decision friction; PETG wins outright on heat resistance, durability, and cost is equal or cheaper than PLA).
- **Two-tone color system:** black/charcoal body + one accent color, not solid bright colors. Two named combos: "Heritage" (black + amber) and "Precision" (black + cyan).
- **Content types:** Name or Car Number, selected via toggle — selecting Car Number nudges the style recommendation toward plate-shaped designs.
- **Character limits, enforced live in the customizer:** ~10 chars for plate-style, ~16 for name-style.
- **Branding stamp (zenkilab.com on back):** opt-out by default (pre-checked), Rs. 50 discount for keeping it on. Framed positively ("save Rs. 50"), not as a penalty for removing it.
- **"Made in Kaduwela, Sri Lanka" on the back: always present**, independent of the branding-stamp toggle — treated as provenance information, not marketing.
- **Design concepts explored** (front + back both matter): Heritage Badge (shield, raised inset panel), Data Plate (rivets, sequential number on back — e.g. "No. 0047"), Coin Medallion (circular, integrated loop instead of a hole), License Plate (light background like a real plate, thin accent border only, minimal back). Final shortlist not yet locked to a specific count — reference the flip-card gallery mockup for all four before deciding which ship.
- Keyring holes across all styles: concentric double-ring detail, echoing the logomark's ring motif.

---

## 6. Technical Notes (for whoever builds this)

- Live key tag preview: React + react-three-fiber for real parametric 3D geometry (extruded shape + extruded text + keyring hole).
- Print-ready file export: `three-3mf-exporter` (npm) — generates Bambu-Studio-compatible 3MF client-side, supports multi-material export (one mesh per color, not one mesh with two colors painted on).
- Order backend: integrated into Zenki Hub (not a standalone endpoint) — new isolated API route, so it doesn't entangle with existing ERPNext quotation logic but keeps order data unified long-term.
- Human QA step before printing is intentional, not a workaround — operator opens the 3MF in Bambu Studio, assigns AMS slots per the emailed color spec, confirms text/geometry, then prints. Keep this step even if automation improves later.
- Mobile performance work already done on the 3D hero scene: `dpr` capped to 1 on mobile, Bloom postprocessing disabled on mobile. Apply equivalent discipline to any new heavy visual work.

---

## 7. Open / Unresolved

- Style count for v1 is decided: Data Plate and License Plate ship first, Heritage Badge and Coin Medallion are phase two.
- Quotation page Confirm button is decided: locks the order into the queue, does not collect payment.
- Real AMS filament color lineup (placeholder colors used in mockups, swap for actual loaded colors before shipping).
- Whether headline/body typography changes beyond the current three-tier system (Space Grotesk headings, Inter body, IBM Plex Mono numbers). That system is locked, but nothing further has been proposed.
