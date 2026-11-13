# Production sprint outcome

Release held. Feature implementation and manufacturing QA are improved; main and the production website remain unchanged. No real emails, customer messages, payments or printing were triggered.

## Release gates

| Gate | Result | Evidence or blocker |
|---|---|---|
| G1 | PASS | Production build, types, Function compilation, 24 submission scenarios, 43 font samples and existing hairline checks pass |
| G2 | PASS | Existing Custom Key Tag exporter unchanged; real browser generation, quote/confirm and attachments pass with mocked email |
| G3 | PASS | 26 CAD cases, 12 independently reloaded pairs, 14 offline P2S slices; tested models have no unresolved critical topology defects |
| G4 | FAIL | Real isolated D1 passes. R2 remains disabled (10042); full private D1/R2 lifecycle unverified |
| G5 | FAIL | Local idempotency, concurrent duplicates and failure/retry pass; real remote R2 recovery still blocked |
| G6 | FAIL | Preview RESEND_API_KEY and recovery admin secret are missing; no live provider acceptance verified |
| G7 | FAIL | No real email sent or actual delivery observed; prior single synthetic business-recipient authorization remains unused |
| G8 | PASS | Deployed 1280 fitting cases across 16 brands, two shapes, all borders, two registrations/color layouts and five widths; controls/noindex pass |
| G9 | PASS | Operator-only private retrieval, SHA checks, no-store and unauthorized HTTP 401 verified; no real customer data used or new public customer-file URLs |
| G10 | FAIL | Production D1 prepared but unbound; production private R2, admin/recovery, retention schedule and complete rollback rehearsal not configured/verified |

## Verified work

- Replaced layered triangle concatenation with true Boolean body/inlay/complete solids. Corrected font fill pinches and the Float32 emblem-base gap. Kept the original sculpted emblem and 70 approved export hashes unchanged.
- 58 x 28 mm, 3.2 mm body, approximately 3.92 mm overall; 4.5 mm hole and 3.25 mm ligament. Both shapes, four borders, two colors and mirrored 0.48 mm back branding.
- Existing general exporter remains unchanged; both products share the same durable service and Resend transport. Added strict Automotive STL/3MF rejection and operator-only private retrieval.
- Real D1 databases created/migrated separately. Preview is bound and tested with independent synthetic write/read/delete requests; empty production D1 stays unbound. No billing plan or R2 was activated.
- Local real SQLite/private-object tests, mocked provider failure/retry, duplicate suppression and frontend package retention pass. Success still requires stored/provider-accepted receipt and never claims inbox delivery.
- Deployed preview at https://feature-automotive-keytags-l.zenkilab.pages.dev/preview/automotive-keytags/zgK-bGNzkybwN8aPd8e_26sDpxL0GRCX opens publicly. It generates actual Mercedes CAD; pending brands prepare inquiries. Readiness is HTTP 503 for RESEND_API_KEY, SUBMISSIONS_FILES and SUBMISSIONS_ADMIN_TOKEN. Unauthorized artifacts return 401.

## Manufacturing evidence and samples

`cad-matrix.json`, `independent-cad.json`, `slicer-results.json` and `approved-geometry-preserved.json` contain machine-readable results. `cad/` contains complete synthetic STL/3MF pairs plus body/accent STL parts. `slicing/` contains actual Bambu Studio 02.09.01.70 P2S PETG sliced QA projects, raw G-code, result JSON and unfiltered CLI diagnostics. `renders/front-back-comparison.png` shows actual mesh front/back views; `responsive/all-16-contact-sheet.png` uses the website renderer.

At 0.16 mm, the synthetic ABC 1234 bold-border capsule estimates 4.12 g in the part, 6.19 g including purge, 26.3 minutes and four filament changes. R5 rectangle: 4.53 g part, 6.60 g including purge, 27.2 minutes. At 0.12 mm, capsule estimates 6.65 g total and 32.3 minutes with six changes; rectangle 7.02 g and 33.5 minutes. These are profile estimates, not measured consumption. Back-down, no supports, three walls, 20% infill, Arachne and textured PEI were tested. Recommend 0.16 mm for routine work; 0.12 mm refines the crown. Check actual AMS 2 Pro assignments and stock manually. Browser archives remain UNSLICED, and QA G-code is not an automatic print authorization.

## Limits and owner actions

- Enable R2 through the Cloudflare Dashboard after reviewing its billing terms. Configure private environment-specific buckets and preview secrets using ../../PRODUCTION_RELEASE.md.
- Real R2 storage/recovery, remote CAD validation CPU/memory limits and real Resend delivery remain unverified. One synthetic message to the configured business destination was previously authorized and remains unused. It must not be sent until bindings/destination are verified; actual delivery needs a signed event or independently observed inbox arrival.
- Production bindings and retention/backup/rollback checks must pass before main merge. The new daily cleanup workflow is deliberately disabled by default.
- Mesh checks cover tested configurations; server checks are not independent regeneration or an exhaustive geometric proof. Existing general CAD retains manufacturing review. Third-party mark authorization remains unverified and all such designs remain review inquiries.
- See ../../PRODUCTION_RELEASE.md for resources, configuration, recovery, retention and rollback; changed-files.json lists the scoped implementation and evidence.
