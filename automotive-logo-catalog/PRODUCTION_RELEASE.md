# Automotive Keytags release operations

Status (14 November 2026): feature preview only. Production release is blocked until the remote storage/email and configuration gates below pass. Do not merge main or enable live submissions based on local tests.

## CAD and manufacturing

`src/lib/cad/automotive.ts` retains the approved sculpted Mercedes STL, existing Three/typeface exporter and 58 x 28 x 3.2 mm body conventions. The locally served, pinned Manifold 3.5.5 WASM kernel now constructs Boolean solids. The only new runtime dependency is the browser port of the solid kernel already used by the approved Python recipe. `scripts/sync-cad-kernel.mjs` copies its module, WASM, license and hashes during prebuild. No customer designs are sent to a CAD service.

Root causes corrected: concatenated layer interfaces; even/odd font-outline pinches; and the Float32 emblem-base gap above the exact body plane. Contour cleanup is 0.001 mm. The emblem shape/source bytes remain unchanged; its placement correction is below 0.00000005 mm. Actual unioned STL dimensions are approximately 58 x 28 x 3.92000008 mm. Keyring diameter is 4.5 mm and minimum nominal ligament is 3.25 mm. Back branding is mirrored and flush in the first 0.48 mm, with at least 2.72 mm of floor above it.

CAD evidence: `reports/production-sprint/cad-matrix.json` (26 cases), `independent-cad.json` (12 independently reloaded pairs), `cad/` (synthetic samples and color-separated parts), `renders/` (actual triangle renders). The triangle-crossing screen detects proper noncoplanar crossings; it is not an exhaustive proof for every possible customer configuration. Tested parts pass independent closure, winding, degeneracy, positive-volume, material intersection, STL/3MF agreement and dominant 0.4 mm stroke checks. Unknown/narrow text is refused if the existing proportional lettering rules cannot fit it. Human manufacturing review remains required.

Bambu Studio 02.09.01.70, P2S 0.4 mm, PETG: 14 offline slicing jobs pass, with two used filaments, selected color preservation and no mesh-repair activity. The Windows GUI launcher drops CLI output in this environment, so the isolated Python harness calls the same official DLL entry point used by its launcher. It uses read-only installed resources and packaged profiles, never user/printer account settings. `slicer-results.json`, `slicer-profiles/` and `slicing/*/{result.json,cli.log,sliced.3mf}` contain reproducible evidence. A vendor end-of-job T65535 diagnostic is retained in logs; successful engine return, per-part filament usage and generated G-code are checked separately. No upload, print command or printer connection is made.

Use back-down printing. Both colors are required in the first branding layers and again for raised front details; ordinary top-side changes cannot color the underside. At 0.16 mm, tested jobs use four filament changes; at 0.12 mm, six. Recommend 0.16 mm for normal orders, or 0.12 mm for the finer crown. Three walls, 20% infill, Arachne, no supports and textured PEI are the tested settings. Confirm actual AMS 2 Pro filament slots and stock before printing. Browser exports are UNSLICED geometry; offline QA sliced projects are review artifacts, never an automatic print authorization. Capsule is the lighter, compact option; R5 rectangle preserves more corner material.

## Shared submission architecture

Both `/api/hub/keytag-order` and `/api/submissions` call the same service. The original Custom Key Tag geometry/exporter is preserved. Contact/configuration validation, stream/archive limits, content hashes, D1 idempotency/state/lease, private R2 storage and readback checks precede the existing Resend notification. Automotive rejects failed closed-solid checks in both STL and 3MF; configuration, dimensions and volumes are checked. This is not independent server CAD regeneration or proof that a hostile client used the declared lettering.

States: received, validated, stored, email_pending, email_accepted, failed, requires_attention, expired. Provider receipt is required for customer success. `delivered:false` remains deliberate: no delivery webhook or real inbox evidence is verified. After an uncertain attempt older than 23 hours, operator review is required instead of risking a resend beyond the provider idempotency window.

Other brands and Request Your Car Logo remain design inquiries. Source artwork, geometry readiness and trademark authorization stay distinct; no manufacturer has been declared commercially authorized. The unlisted/noindex customer route, catalog, two-tone choices and WhatsApp option remain.

The customer retains package/configuration on recoverable failure and receives a copyable reference after accepted persistence/notification. To retry stored files: POST `/api/submissions/retry` with admin bearer header and JSON reference. To retrieve: GET `/api/submissions/artifact?reference=...&name=model.3mf` with that same header. URL/reference alone gives no access. Retrieval verifies SHA-256 and uses no-store/nosniff attachment responses. No public R2 or raw customer-CAD route exists.

## Actual Cloudflare resources

Account `981c8c76bc6db02b1f2534e7054a7536`, existing Pages project `zenkilab`:

| Environment | D1 database | ID | Namespace | State |
|---|---|---|---|---|
| Preview | zenkilab-submissions-preview-ak | c279c462-84f0-4479-bd47-c6c9368f3d7e | preview/feature-automotive-keytags-logo-catalog | Migrated, bound only to Preview, real isolated write/read/delete passes |
| Production | zenkilab-submissions-production-ak | 5af57b01-4665-46ca-9d34-bc8c6b55c7ab | production/zenkilab-keytags | Migrated empty database, deliberately UNBOUND |

Do not recreate these databases. `migrations/0001_submissions.sql` is additive. The new empty production database was initialized with its own production namespace; the API refuses a database whose single-row namespace guard does not match its environment. Existing production Pages configuration was compared before/after preview changes and is unchanged. No production customer data was read/copied.

R2 API still reports 10042 (enable through Dashboard) at the account audit. Owner must review R2 billing terms; no paid activation/purchase was performed. After enablement, create separate PRIVATE preview/production buckets, never r2.dev/public buckets. Bind SUBMISSIONS_FILES to the correct environment bucket. The preview also needs the existing RESEND_API_KEY and a strong SUBMISSIONS_ADMIN_TOKEN configured through normal secret settings, not chat/repository files. Preview namespace, allowed host and 30-day retention are configured already. Host: `feature-automotive-keytags-l.zenkilab.pages.dev`. Production needs its own corresponding namespace, allowed host `zenkilab.com`, private storage and secrets verified before binding/launch.

Expected small pilot usage: 100 submissions/month, roughly 0.2-0.8 GB of retained attachments at the enforced limits, and metadata far below 5 GB. D1's included usage and R2's included storage/operation quotas may cover this; no zero-cost guarantee or spending cap is assumed. Check account quotas/alerts before launch. Official pricing: https://developers.cloudflare.com/d1/platform/pricing/ and https://developers.cloudflare.com/r2/pricing/ . Remote Function CPU/memory limits with the configured account still need measurement; local validation does not prove the Cloudflare plan can process every maximum-size archive.

## Retention, backup and recovery

Default retention is 30 days (7-180 configurable). Metadata records object keys before writes so failed partial writes remain discoverable. Authenticated `/api/submissions/cleanup` deletes expired objects and personal metadata, keeping minimal digest/reference tombstones to prevent replay. Test expiration on isolated storage first. The new GitHub retention workflow is OFF unless main and repository variable KEYTAG_SUBMISSION_CLEANUP_ENABLED=true. Configure the protected production-submissions environment and matching admin secret, then run it manually and inspect sanitized counts before enabling its schedule. It removes at most 1,000 expired submissions per run; monitor backlog and adjust frequency if needed.

Use D1's supported backup/Time Travel and an approved private artifact backup policy before any non-additive migration. Do not restore production customer data into preview. Roll back application code independently from data: retain D1/R2 and provider receipts for recovery, never drop tables/buckets as a code rollback. Do not automatically roll back irreversible migrations. If reverting to the older non-durable endpoint, keep submissions disabled until its behavior is explicitly approved.

## Release checklist

`reports/production-sprint/release-gates.json` is the authoritative outcome for this run. Before main merge: verify isolated real D1 AND R2 lifecycle, attachment checksums/retrieval, duplicate suppression and recovery; Resend acceptance plus controlled actual delivery; remote runtime limits; production bindings and tested retention/rollback. The existing explicit authorization for one synthetic message to the configured business recipient remains unused. Do not consume it until the preview is correctly bound and the destination/provider are verified. Provider acceptance is not delivery; obtain a signed event or independently observed inbox arrival. No customer information should appear in public logs or QA fixtures.

After all gates pass, synchronize with main, review only scoped files, merge via the existing authorized repository workflow, allow Cloudflare's Git integration to deploy, and verify the live store/API/privacy. The old GitHub Pages workflow also exists on main; Cloudflare is the actual site provider. No production merge is permitted while a mandatory gate fails.

## Future brand CAD onboarding

Keep sanitized proportional SVGs inquiry-only until brand-specific sculpting, minimum-feature and geometry/slicer tests pass. Reuse the same generator/export/material conventions and full shape/border tests. Do not replace sculpted Mercedes with a flat SVG or equate an asset license with permission to manufacture trademark-bearing goods.
