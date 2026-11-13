> Current storage policy: D1 BLOB default, no R2 activation or paid services. See [D1_STORAGE.md](D1_STORAGE.md) for current limits, setup, remote evidence and release gates.

# Shared keytag submissions — implementation and release gate

## Architecture

Both Custom Key Tag (`/api/hub/keytag-order`) and Automotive (`/api/submissions`) now call `functions/_lib/submissions/service.ts`. The legacy endpoint is only an adapter. Existing Custom Key Tag Three.js/typeface/3MF export is unchanged. Browser submission no longer suppresses development errors; it requires a persisted/provider-accepted receipt and retains the same order/package on a recoverable retry.

Automotive `src/lib/cad/automotive.ts` reuses Three.js, FontLoader, STLLoader/STLExporter, the existing 3MF exporter, JSZip, dimensions and border rules. The sculpted Mercedes emblem is copied byte-for-byte from the approved reference STL into a generic browser construction asset with its SHA-256. New registrations, both shapes, all borders and two body/accent materials are actually generated. The old approved STL/3MF files are never overwritten. The public browser construction asset is a generic emblem, not an individualized customer file; generated customer packages have no public download route.

Other brands return no CAD from the generator and submit a design inquiry. Server-owned catalog lookup records the selected asset/hash. All submissions remain commercial/design/manufacturing review requests, never automatic print instructions or checkout.

`SubmissionPanel` adds prepare/review/contact/submit to the existing automotive UI. It captures a real JPEG preview, retains the prepared blobs across retry, and uses one stable random reference. Existing general keytag UI still uses its original preview and exporter, with the stronger shared server receipt.

## What is and is not verified

Client generation is real; it is not server regeneration. The Function checks ZIP size/entry policy, model presence, finite vertex coordinates, triangle indices, component references, edge counts, automotive dimensions, exactly two matching filament colors, configuration metadata and SHA-256 attachment integrity. Configuration matching establishes consistency between declarations, not independent proof of fidelity; a malicious client can forge both. No independent solid intersection analysis is claimed.

The Automotive browser generator now uses the same Manifold 3.5.5 solid kernel family as the approved native recipe, lazily loaded from locally served WASM. It performs real body/inlay subtraction and final STL union. Winding-aware font contours are cleaned at 1 micrometre. The imported sculpted STL base is snapped by less than 0.00000005 mm to the exact body plane before joining; its shape and source bytes are preserved. This resolves internal layer faces, pinched font regions and the Float32 base-plane gap.

The sprint report records 26 CAD configurations and independent checks of 12 serialized STL/3MF pairs. The individual material meshes and unioned STL pass closure, manifold-edge, winding, positive-volume and degenerate-face checks. Independent Boolean intersection and STL/3MF symmetric-volume comparisons pass. Proper noncoplanar triangle crossings are screened; this is not a proof covering all possible geometric configurations. Minimum dominant 0.4 mm strokes and a 3.25 mm hole ligament pass for tested cases. Arbitrary future customer text still receives structural checks and manufacturing review.

Automotive submissions now reject failed edge/winding/degenerate/positive-volume checks in either 3MF or STL, and reject STL/3MF volume disagreement. These are runtime structural checks, not independent server regeneration or proof that a malicious client produced the declared lettering. The original general exporter remains unchanged and retains its separate manufacturing review requirement.

Bambu Studio 02.09.01.70 completed 14 offline P2S 0.4 mm PETG slices at 0.16/0.12 mm, preserving two filament colors and reporting no topology-repair activity. Browser-created 3MF remains unsliced geometry. Offline QA sliced projects/G-code are separate review artifacts; no print/upload command is called. See `reports/production-sprint/` and `PRODUCTION_RELEASE.md` for current evidence and release gates.

## Durable state / retry semantics

D1 rows persist received → validated → stored → email_pending → email_accepted. Failure is retained as failed; stale attempts use a short lease. Repeated identical reference/payload/file digests return the original receipt; conflicts are rejected. Provider calls use a stable stage-specific Resend Idempotency-Key and exactly the same attachments on retry. No fallback drops the preview. After 23 hours, uncertain sends require operator attention instead of risking duplicate mail beyond the provider's idempotency window.

D1 metadata, file chunks and stored state commit in one transaction. The optional legacy R2 adapter records metadata before writes so partial writes remain discoverable; it is not authorized under the current $0 policy. Only complete stored packages enter notification. Private file reads are hash checked before attaching. D1 provider receipt stores Resend ID. `delivered:false` is intentional: no signed delivery webhook is configured, so provider acceptance is never called inbox delivery.

Customer retry reuses the package/reference. An operator can POST `{ "reference": "..." }` to `/api/submissions/retry` with `Authorization: Bearer <SUBMISSIONS_ADMIN_TOKEN>`; it uses private stored artifacts and never needs the customer's browser. Never log the token or put it in URLs. It is not exposed to the client.

POST `/api/submissions/cleanup` with the same admin header removes expired objects, clears personal payload/artifact metadata and leaves minimal reference/digest tombstones to reject expired replay. Default retention is 30 days, configurable from 7–180. Expiry does not schedule itself: run authenticated cleanup from an approved scheduled Worker or an operator task. No public raw CAD download route or R2 public URL is provided.

Rate limiting hashes Cloudflare's connecting IP into 15-minute buckets and allows five new submissions per bucket. Existing-reference retries do not create new email attempts concurrently. This is a basic application control, not a substitute for Cloudflare WAF/bot controls. Origin and exact allowed-host checks restrict the preview branch. Byte limits and enum/contact validation apply before persistence. No arbitrary SVG/upload execution is supported.

## Current provisioning (D1-only)

Both existing isolated D1 databases have the additive private-file migration. Preview is bound and uses transactional D1 BLOB storage by default. Production remains unbound. No R2 service is required or activated. Do not follow historical R2 activation recommendations under the current $0/no-payment-method policy.

Remote D1 file persistence, complete reconstruction/checksums, private retrieval, atomic rollback, quotas and retention now pass. Missing Resend keeps stored packages pending with explicit HTTP 202 and no success/delivery claim. Preview needs the existing RESEND_API_KEY; the QA admin secret is already configured securely. The authorized token cannot inspect billing (403); the owner must confirm Workers Free and Resend Free/overages disabled before release. Exact resources, dashboard instructions and limits are in D1_STORAGE.md.

## Migration / rollback

The SQL migration is additive and isolated. Apply it first to the preview database. Back up D1 metadata and reconcile private artifacts before changing schemas. For rollback, redeploy the prior feature code while retaining private D1/R2 resources for operator recovery; do not DROP tables or delete buckets to roll back code. The prior API lacks durability safeguards, so do not accept new submissions through it as if it retained this contract. Personal data cleanup is explicit/authenticated; tombstones prevent deleted-reference replay. Production bindings/main are not modified here.

## Tests / outstanding release gates

`source/check-shared-submissions.cjs` uses real file-backed SQLite with reopen verification, a private filesystem object adapter and a mocked Resend boundary. It executes the actual shared Function and checks geometry packages, both products, duplicate suppression, consistent attachment bytes/idempotency key, provider failure, storage failure, oversized/invalid input, retention cleanup and expired replay.

`source/submission-qa-server.cjs` serves the actual exported UI and shared Function over HTTP with those local adapters. `source/check-submission-browser.cjs` verifies mobile Mercedes preparation/submission, CAD-pending inquiry and the existing general keytag browser exporter/submission. The provider is mocked; these checks do not prove a real inbox received mail.

Release gates still open: confirming zero-cost account plans, preview Resend configuration and actual delivery, measuring configured Cloudflare CPU/memory limits for archive/mesh inspection, and an explicitly scheduled synthetic live email with provider receipt plus delivery evidence. The prior single-email authorization is unused. This implementation is not claimed production-ready until those checks pass. No real customer messages, orders or printing were triggered.

Cloudflare deployment regression: server validation now imports only pure typeface measurements and color configuration. Three.js stays in the browser CAD/preview path. The font parity regression covers 43 registration samples against the existing FontLoader output; this avoids Worker startup failures from browser-only rendering globals.

Operator-only GET `/api/submissions/artifact?reference=...&name=model.3mf` requires the admin bearer header, validates the stored checksum and returns no-store attachments. A reference or URL alone never grants access. The retention GitHub workflow stays disabled unless main and KEYTAG_SUBMISSION_CLEANUP_ENABLED=true, and uses the protected production-submissions environment secret. It must be configured and exercised before release.
