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
| **Amber — primary, dominant** | `--color-accent-primary` | `#F5A623` base, `#FFC35C` light |
| Cyan — restrained secondary | `--color-accent-warm` (legacy token name, holds cyan) | `#38C8F5` |
| Buttons | `--color-cta` (alias of the amber accent) | `#F5A623`, hover `#FFC35C`, dark text |
| Errors only | `--color-danger` | `#EF4444` |

**Rules:**
- Amber leads everywhere: nav, primary buttons, brand mark, primary UI. Primary buttons are amber-filled with dark text. Red is reserved for errors and never used on a button.
- Button labels are Title Case and name the action: "Start a Project", "Go to Store". One label per intent across the page.
- Cyan is scoped to small precision/tech details only — icons, minor rim accents, the hologram element in the hero. Never primary nav/CTA.
- Gradients always go **light to base**, e.g. `#FFC35C → #F5A623`. Never base to dark (e.g. never `#F5A623 → #A86F10`) — that reads muddy, not premium.
- Token names in `globals.css` are historical (`--color-accent-warm` holds cyan, not a warm color) — documented with comments in the file, not renamed, to avoid touching ~70 references.

---

## 2. Typography

Three-tier system, each font has one job, none of them overlap:

- **Space Grotesk (weight 600/700)**: the wordmark ("Zenki Lab" logo text), and now also H1/H2 headings site-wide. Anywhere the page is making a statement rather than explaining something.
- **Inter**: body copy, paragraphs, nav links, buttons, form labels. Stays quiet and readable, carries no personality on purpose, that is Space Grotesk's job.
- **IBM Plex Mono**: prices, stats, specs, anything numeric. Used for the Store prices and the quote pages.

This replaces the earlier "wordmark only, don't touch headings" restriction, that was correct while the decision was still open, it is now closed.

No em dash characters anywhere in site copy, reads as AI-generated. Use periods, commas, or restructure the sentence instead.

---

## 3. Logo

**Logomark:** abstract "Z" precision mark — two rings rotating in opposite directions around a fixed white Z.
- Outer ring: amber `#F5A623`, opacity 0.45, dashed (`10 8`), rotates counter-clockwise, 10s
- Inner ring: cyan `#38C8F5`, opacity 0.45, solid, rotates clockwise, 7s
- Z: white `#FFFFFF`, stroke-width 3.4, rounded caps/joins, fixed (does not rotate)
- ViewBox `0 0 40 40`

**Wordmark:** "ZenkiLab", fully merged, no gap, one continuous word. "Zenki" white, "Lab" amber, color break is the only separation between them. Implemented as a single SVG text element with two tspans and zero dx offset, not two separate positioned text elements, that approach was fragile and caused the spacing bugs seen earlier.

Already implemented in `header.tsx` and `favicon.svg` (rings/Z only — wordmark font not yet updated there, see Section 2).

---

## 4. Layout Patterns

**Depth panel** (About on the homepage, and the model for front page sections): a large photo in a rounded frame that drifts slower than the page and settles as it arrives, a big Space Grotesk heading that moves at its own rate and overlaps the photo edge, and the story fading in behind it. Scroll-linked with Motion `useScroll`, so it follows the visitor in both directions. Static under reduced motion. Section headings elsewhere use the lighter `ScrollFade` (fade in and rise as they travel up the screen).

**Stage and index** (Services): one large image with a list of titles beside it. Click, tap, hover or arrow keys change the selection and the image swaps with a soft reveal. The scene has no frame: the photo behind is dimmed, softly blurred and faded into the page, and the subject (a cut-out, `/services/stage/*-cut.webp`) stands sharp in front of it, so it comes out of the fade. On fine pointers the two layers drift differently with the cursor. Nothing depends on scroll position. This replaced the earlier pinned-pane crossfade and the pinned-photo pattern, both dropped because the active item depended on exactly where scrolling stopped, so the visitor could not control where the pane locked.

**Store listing:** a layered intro on turning rings, then one scroll-scrubbed scene per product (`StoreExperience`). Each product sits in a hard circle on the brand rings, and the subject comes out of the circle: the photo is clipped to the circle while a cut-out of the subject (transparent background) is drawn over its edge in exactly the same place. The chibi figure's head rises above the top, the key tag's ends poke out of the sides. On desktop the key tag is the real 3D geometry and turns from left to right as its scene scrolls (a still is used on touch devices and under reduced motion). Cut-outs live beside the photos as `*-cut.webp`, and `place()` in `src/lib/stage.ts` positions a subject from its pixel box.

**Slideshows:** photos change every 3 seconds with a soft crossfade and a slow push-in. The outgoing photo keeps its zoom while it fades and pausing freezes the zoom in place, so nothing snaps. No autoplay under reduced motion, hold on hover and focus, pause button and dots always present.

**Cropping large photos:** always crop on the subject, never a plain centre crop. Product shots are pre-cropped to 4:5 around the subject's bounding box. Landscape photos carry a `focus` (object-position) that keeps the subject in frame.

**Product detail pages (Store):** one large hero (a slideshow of subject-cropped photos, no thumbnail rail, deliberately removed). Purchase panel on the other side: rating, title, description, trust badges, relevant customization controls, quantity, price, primary action button. Real routing (`/store/[slug]`), not client-state toggling.

**Quotation / order confirmation page:** shown after a customer finishes customizing and clicks the primary CTA. Contains: design recap (small thumbnail + summary), itemized spec list, price breakdown as separate line items (not just a final number), a "what happens next" note, a visible quote expiry (e.g. 24 hours), and Confirm + Edit actions. Clarify explicitly whether Confirm collects payment or just locks the order into the queue — don't leave that ambiguous in the UI copy.

---

## 5. Key Tag Product — Specific Rules

- **Material: PETG only.** Not offered as a customer choice (removes decision friction; PETG wins outright on heat resistance, durability, and cost is equal or cheaper than PLA).
- **Two-tone color system:** black/charcoal body + one accent color, not solid bright colors. Two named combos: "Heritage" (black + amber) and "Precision" (black + cyan).
- **Content types:** Name or Car Number, selected via toggle — selecting Car Number nudges the style recommendation toward plate-shaped designs.
- **Character limit, enforced live in the customizer:** 14 characters, lettering auto-fits the space beside the keyring rings.
- **Front:** only what the customer types. **Back:** the zenkilab.com marketing stamp, or blank without it. The stamp is opt-out by default (pre-checked), Rs. 50 discount for keeping it on. Framed positively ("save Rs. 50"), not as a penalty for removing it.
- **Shape (v1): one capsule**, 64 x 25 mm, 3.6 mm thick, keyring hole at the left with a boss ring and a thin outer ring (the logomark's ring motif). It replaces the earlier Data Plate and License Plate styles: one shape holds a name or a car number, there is no style picker, and one price. Heritage Badge and Coin Medallion stay phase two.
- **Emboss and deboss:** the rim (1.4 mm wide), the lettering and the rings stand 1.0 mm proud on both faces. Everything inside the rim is the recessed floor, 1.6 mm thick, so 1.0 mm deboss and 3.6 mm overall. Lettering is Space Grotesk Bold, at least 0.8 mm stroke and about 5 mm tall or more so it prints cleanly.
- **Colors in print:** black floor, accent (amber or cyan) rim, rings and lettering. Two objects in the 3MF, one per color. Back face: rim and rings always, `ZenkiLab.com` raised only if the marketing line is kept.
- **Pricing:** Rs. 300 without the marketing line and without RFID, Rs. 250 with the `ZenkiLab.com` line, RFID chip adds Rs. 200 either way.
- **RFID (optional):** a 20 x 10 mm wet inlay sealed in a 20.6 x 10.6 x 0.5 mm pocket inside the floor. The operator pauses the print at Z = 2.05 mm, places the inlay, and resumes. The emailed spec says when to pause.
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

- Key tag v1 is decided: one capsule shape (see section 5). Heritage Badge and Coin Medallion are phase two.
- Quotation page Confirm button is decided: locks the order into the queue, does not collect payment.
- Real AMS filament color lineup (placeholder colors used in mockups, swap for actual loaded colors before shipping).
- Whether headline/body typography changes beyond the current three-tier system (Space Grotesk headings, Inter body, IBM Plex Mono numbers). That system is locked, but nothing further has been proposed.
