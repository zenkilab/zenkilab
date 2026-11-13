# Shared keytag submissions — implementation and release gate

## Architecture

Both Custom Key Tag (`/api/hub/keytag-order`) and Automotive (`/api/submissions`) now call `functions/_lib/submissions/service.ts`. The legacy endpoint is only an adapter. Existing Custom Key Tag Three.js/typeface/3MF export is unchanged. Browser submission no longer suppresses development errors; it requires a persisted/provider-accepted receipt and retains the same order/package on a recoverable retry.

Automotive `src/lib/cad/automotive.ts` reuses Three.js, FontLoader, STLLoader/STLExporter, the existing 3MF exporter, JSZip, dimensions and border rules. The sculpted Mercedes emblem is copied byte-for-byte from the approved reference STL into a generic browser construction asset with its SHA-256. New registrations, both shapes, all borders and two body/accent materials are actually generated. The old approved STL/3MF files are never overwritten. The public browser construction asset is a generic emblem, not an individualized customer file; generated customer packages have no public download route.

Other brands return no CAD from the generator and submit a design inquiry. Server-owned catalog lookup records the selected asset/hash. All submissions remain commercial/design/manufacturing review requests, never automatic print instructions or checkout.

`SubmissionPanel` adds prepare/review/contact/submit to the existing automotive UI. It captures a real JPEG preview, retains the prepared blobs across retry, and uses one stable random reference. Existing general keytag UI still uses its original preview and exporter, with the stronger shared server receipt.

## What is and is not verified

Client generation is real; it is not server regeneration. The Function checks ZIP size/entry policy, model presence, finite vertex coordinates, triangle indices, component references, edge counts, automotive dimensions, exactly two matching filament colors, configuration metadata and SHA-256 attachment integrity. Configuration matching establishes consistency between declarations, not independent proof of fidelity; a malicious client can forge both. No independent solid intersection analysis is claimed.

**New layered browser meshes can fail the watertight edge screen**, just as the audited general exporter did. The response and stored package explicitly require manufacturing review and report boundary/nonmanifold counts. The generated STL may contain touching shells. These samples are not certified single-solid/watertight printer-ready files. The existing individually validated Mercedes reference and prior approved batch are untouched. Robust Boolean solid verification is still required before production acceptance where the edge screen fails.

`reports/shared-submissions/` contains actual eight Mercedes shape/border 3MF/STL pairs, receipts and validation results. Structural dimensions, material metadata and changed registration were checked by the actual server validator. These are unsliced manufacturing-review samples, not ready-to-print projects.

## Durable state / retry semantics

D1 rows persist received → validated → stored → email_pending → email_accepted. Failure is retained as failed; stale attempts use a short lease. Repeated identical reference/payload/file digests return the original receipt; conflicts are rejected. Provider calls use a stable stage-specific Resend Idempotency-Key and exactly the same attachments on retry. No fallback drops the preview. After 23 hours, uncertain sends require operator attention instead of risking duplicate mail beyond the provider's idempotency window.

Artifacts are recorded in metadata before R2 writes so partial writes remain discoverable for cleanup. Only after every required object is stored does notification run. R2 reads are hash checked before attaching. D1 provider receipt stores Resend ID. `delivered:false` is intentional: no signed delivery webhook is configured, so provider acceptance is never called inbox delivery.

Customer retry reuses the package/reference. An operator can POST `{ "reference": "..." }` to `/api/submissions/retry` with `Authorization: Bearer <SUBMISSIONS_ADMIN_TOKEN>`; it uses private stored artifacts and never needs the customer's browser. Never log the token or put it in URLs. It is not exposed to the client.

POST `/api/submissions/cleanup` with the same admin header removes expired objects, clears personal payload/artifact metadata and leaves minimal reference/digest tombstones to reject expired replay. Default retention is 30 days, configurable from 7–180. Expiry does not schedule itself: run authenticated cleanup from an approved scheduled Worker or an operator task. No public raw CAD download route or R2 public URL is provided.

Rate limiting hashes Cloudflare's connecting IP into 15-minute buckets and allows five new submissions per bucket. Existing-reference retries do not create new email attempts concurrently. This is a basic application control, not a substitute for Cloudflare WAF/bot controls. Origin and exact allowed-host checks restrict the preview branch. Byte limits and enum/contact validation apply before persistence. No arbitrary SVG/upload execution is supported.

## Provisioning status and exact preview setup

Cloudflare OAuth login is valid, including D1/Pages write scopes. D1 listing showed no existing databases. R2 listing returned API code 10042: **enable R2 through the Dashboard**. No billing activation or paid-plan change was made. Remote persistence remains unverified. The preview's Resend secret was already missing in the previous audit. Neither product silently falls back to browser storage; the live APIs return 503 until configured.

1. Owner: Cloudflare Dashboard → R2 Object Storage → enable R2 after reviewing billing. Do not enable a public bucket/r2.dev endpoint. Confirm account plan/quota before accepting usage.
2. Create isolated resources, for example:
   - `npx wrangler d1 create zenkilab-submissions-preview-ak`
   - `npx wrangler r2 bucket create zenkilab-submissions-preview-ak`
   - `npx wrangler d1 execute zenkilab-submissions-preview-ak --remote --file migrations/0001_submissions.sql`
3. Workers & Pages → `zenkilab` → Settings → Bindings, select **Preview**:
   - `SUBMISSIONS_DB`: that isolated D1 database.
   - `SUBMISSIONS_FILES`: that private R2 bucket.
4. Preview Variables and Secrets:
   - `RESEND_API_KEY`: existing authorized provider key, entered as a secret, never committed/pasted into chat.
   - `SUBMISSIONS_ADMIN_TOKEN`: fresh strong random admin secret, not shared with customer/browser code.
   - `SUBMISSION_NAMESPACE`: `preview/feature-automotive-keytags-logo-catalog`.
   - `SUBMISSION_ALLOWED_HOSTS`: `feature-automotive-keytags-l.zenkilab.pages.dev`.
   - `SUBMISSION_RETENTION_DAYS`: `30`.
5. Redeploy the feature preview. GET `/api/submissions` must report ready true. Other preview branch hosts are intentionally rejected by the allowlist. Pages preview bindings may be shared across branches: use these feature-only resources, allowlist and namespace, never production data. Trusted deploy access is still required; for untrusted preview branches use a separate project instead of exposing shared secrets.
6. Schedule authenticated cleanup; test synthetic submissions and operator retry before launch. Configure production resources/secrets separately only during a separately authorized production release.

D1 and R2 have free included usage but are not an unlimited/no-cost guarantee. Published pricing: https://developers.cloudflare.com/d1/platform/pricing/ and https://developers.cloudflare.com/r2/pricing/ . No account-specific spending limit or subscription upgrade is assumed. Model sizes, retained count and query/object operations determine cost; set Cloudflare usage alerts and keep the retention job running.

## Migration / rollback

The SQL migration is additive and isolated. Apply it first to the preview database. Back up D1 metadata and reconcile private artifacts before changing schemas. For rollback, redeploy the prior feature code while retaining private D1/R2 resources for operator recovery; do not DROP tables or delete buckets to roll back code. The prior API lacks durability safeguards, so do not accept new submissions through it as if it retained this contract. Personal data cleanup is explicit/authenticated; tombstones prevent deleted-reference replay. Production bindings/main are not modified here.

## Tests / outstanding release gates

`source/check-shared-submissions.cjs` uses real file-backed SQLite with reopen verification, a private filesystem object adapter and a mocked Resend boundary. It executes the actual shared Function and checks geometry packages, both products, duplicate suppression, consistent attachment bytes/idempotency key, provider failure, storage failure, oversized/invalid input, retention cleanup and expired replay.

`source/submission-qa-server.cjs` serves the actual exported UI and shared Function over HTTP with those local adapters. `source/check-submission-browser.cjs` verifies mobile Mercedes preparation/submission, CAD-pending inquiry and the existing general keytag browser exporter/submission. The provider is mocked; these checks do not prove a real inbox received mail.

Release gates still open: enabling/configuring remote D1/R2, preview Resend secret and account limits, exercising real remote persistence/recovery, resolving/manually approving mesh-topology warnings, measuring configured Cloudflare CPU/memory limits for archive/mesh inspection, and an explicitly scheduled synthetic live email with provider receipt plus delivery evidence. The prior single-email authorization is unused. This implementation is not claimed production-ready until those checks pass. No real customer messages, orders or printing were triggered.
