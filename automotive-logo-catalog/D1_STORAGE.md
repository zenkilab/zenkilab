# D1-only private submissions ($0 policy)

Current release gate: feature preview only. No paid service, payment method, R2 subscription or new recurring service was activated. Production main/site configuration is unchanged. The account billing API returns 403, so the owner still must verify Workers Free and Resend Free with Transactional Overages disabled. Small test usage or a successful request does not prove an account is on a free plan.

**Critical runtime blocker:** repeated real requests on deployment `78e7c35` returned HTTP 503 with Cloudflare's "Worker exceeded resource limits" page. Its live Pages log explicitly reported `Exceeded CPU Limit` / `Worker exceeded CPU time limit`. This affected CAD submissions and a 508,039-byte inquiry preview. Small 11,840-byte preview inquiries passed all 11 remote storage cases. The logical file limits below are not qualified safe operating limits on Workers Free. Neither full CAD intake nor the entire $0 workflow is production-ready. Do not upgrade the account to work around this constraint. A bounded, multi-request processing design or equivalent Free-compatible solution must be validated before release, without dropping server validation or silently omitting CAD.

## Architecture and hard bounds

Both product endpoints reuse `functions/_lib/submissions/service.ts`. `storage.ts` selects D1 by default, even if an R2 binding exists. The optional old adapter is selected only with both SUBMISSION_STORAGE_BACKEND=r2 and SUBMISSION_R2_AUTHORIZED=true; this is NOT authorized under the current business constraint. No public media bucket is reused.

Migration `0002_private_d1_files.sql` adds private `submission_files`, ordered `submission_file_chunks`, transactional byte accounting and quota guards. Files <=256 KiB use one BLOB; larger files use controlled 256 KiB chunks to bound binding serialization and memory. Each row is far below D1's 2,000,000-byte row/value limit. Maximum file: 3 MiB; package: 4 MiB; maximum 12 chunks/file and 16 chunks/package. The default logical attachment budget is 64 MiB; configuration may lower it to 1 MiB or raise it only up to the compiled 128 MiB ceiling. Metadata and rate tables each stop at 10,000 records. The application admits at most 200 submission attempts/day and at most 80 email API attempts/day, 2,000/month per isolated database. Other applications sharing the provider account still consume its quotas.

The default budget holds roughly 60 packages like the tested 0.93 MiB Mercedes package, or fewer larger packages. This is bounded small-business storage, not unlimited archival capacity. Overlarge/full submissions fail explicitly (413/507), retain the browser package and point to the existing WhatsApp design-review/manual-attachment option. No files are silently omitted. Unsupported or duplicate attachment fields are rejected.

A single D1 `batch()` transaction inserts metadata, replaces only an identical unaccepted reference's files, stores all chunks and changes state to stored. A failure rolls back metadata, BLOBs and accounting together. Known provider-accepted references remain immutable. Integrity is SHA-256 over the complete original file; retrieval checks declared chunk count/order, aggregate length and checksum before returning any file. The operator endpoint also checks its submission manifest checksum. No SQL or object key is accepted from a customer. All statements are prepared and retrieval uses only a reference plus an allowlisted filename and admin bearer token.

D1-only storage health no longer depends on R2, Resend or an admin secret. GET /api/submissions returns HTTP 200 with storageReady=true when D1 is healthy, while ready/notificationReady remain false if email is unavailable. A valid upload can be persisted with HTTP 202 when Resend is missing; it explicitly says no email was sent. Both UIs retain the prepared package and show this pending outcome. Automotive also exposes Copy Reference for a persisted but notification-pending receipt. Ordinary submission success still requires a provider ID and never claims inbox delivery.

Email uses the same configured business sender/recipient, private bytes, stable idempotency key and retry lease. Local tests mock Resend; real remote storage tests use an admin-authenticated X-Zenki-Storage-Only header, restricted to preview namespaces, and return only a stored/held state. This is real D1 storage, not mock acceptance. No provider delivery is simulated or counted as verified. The header is absent from customer UI requests and is forbidden without admin authentication or outside preview namespaces.

## Actual resources and evidence

Existing isolated databases:

| Environment | Database | ID | Namespace |
|---|---|---|---|
| Preview | zenkilab-submissions-preview-ak | c279c462-84f0-4479-bd47-c6c9368f3d7e | preview/feature-automotive-keytags-logo-catalog |
| Production | zenkilab-submissions-production-ak | 5af57b01-4665-46ca-9d34-bc8c6b55c7ab | production/zenkilab-keytags |

Both additive migrations are applied to these existing databases. Production remains empty/unbound to the site. The namespace guard prevents accidental cross-environment use. Preview selects d1 and 67108864 bytes. Its QA admin key is stored in Cloudflare as a secret; the local copy is Windows-DPAPI encrypted under ignored `.tokensave/d1-preview-admin.dpapi`. No raw key is committed/logged. The owner can rotate it through normal settings; production needs a different secret.

`reports/d1-storage/remote-inquiry.json`: 11 passing real Cloudflare Pages + D1 checks for a small inquiry, byte-exact private retrieval, unauthorized 401, checksum corruption rejection/repair, duplicate suppression, actual file-chunk SQL-trigger rollback/retry, full-capacity rejection, missing email configuration and retention/tombstones. Faults were injected only through authorized administration on the isolated preview. Only the synthetic client's rate bucket was reset at start and between groups; application rate controls remain intact. Cleanup removed all synthetic files/PII; zero orphan chunks remain. No real email was sent.

`remote-cad-resource-failure.json` and `remote-large-inquiry-cpu-failure.json` record failing full-CAD/larger-preview attempts. Initial CAD runs did complete uploads, multi-chunk PNG/3MF/STL checksum retrieval and rollback/quota checks, but repeats exposed runtime failures; those initial successes do not establish reliable end-to-end operation. `remote.json` remains a failing diagnostic, not a passing acceptance report. Local SQLite/provider mocks cover 16 D1 groups and 24 legacy-adapter cases. They do not override this remote blocker.

Initial successful wall times were roughly 0.45-1.3 s including network/validation/database latency, NOT CPU measurements. Repeats failed the actual CPU gate. A separate local Node profile takes roughly 150-290 ms wall time for existing CAD checks; it is not a measurement of Cloudflare CPU. Workers Free documents a 10 ms CPU budget and 128 MB memory. D1 Free limits include 500 MB/database, 5 GB/account and daily read/write caps that stop queries rather than bill overages. Logical deletion frees reusable database pages; physical file size may not shrink. Keep byte/metadata ceilings and inspect actual database size before increasing capacity.

`local.json` covers transactional/replacement rollback, quota, corruption, privacy, pending notifications, explicit preview-only mail hold and mocked provider recovery. Existing 24 legacy-adapter submission scenarios, font, CAD, Bambu and browser suites remain separate evidence; mocks are never labeled remote verification.

## Retention, backup and rollout

Retention defaults to 30 days. Expired files cannot be retrieved even before cleanup. D1 cleanup atomically cascades chunk deletion, clears PII and preserves minimal reference/digest tombstones for replay prevention. The existing protected GitHub cleanup workflow remains disabled until configured on main. Run it manually after release preparation, then enable its existing free runner schedule only after confirming account policies. Manual authenticated cleanup is available without another service. Never point preview at production customer data.

Back up with D1's supported export/Free Time Travel before non-additive changes. Do not automatically reverse database migrations. Code rollback preserves D1/files/provider receipts for recovery; an older R2-only API is not a safe rollback while D1 BLOB submissions are in use. Keep intake paused until a compatible code version is selected. No production rollback/launch is claimed verified yet.

Before production: resolve and remotely validate the Free CPU runtime blocker; verify Free plans and overages disabled; configure/test the existing Resend key and independently verify the one authorized synthetic delivery; confirm production D1 binding, distinct admin secret, allowed host and namespace; test cleanup/backup/rollback; review scoped diff and all gates. Automotive stays unlisted/noindexed. Browser 3MF remains unsliced geometry and no printing is authorized.

## Owner dashboard steps

1. Cloudflare account: Manage Account > Billing > Subscriptions. Confirm Workers Free. No upgrade/checkout/payment-method step is required by this implementation.
2. Resend: https://resend.com/settings/billing . Confirm Free; paid transactional overages are unavailable on Free. Do not enable pay-as-you-go.
3. Existing Pages project zenkilab > Settings > Variables and Secrets > Preview. Add RESEND_API_KEY as Secret/Encrypt using the existing account's sending key. If the saved value is unavailable, create a Sending-access key restricted to zenkilab.com in https://resend.com/api-keys . Do not expose it in chat, logs or source; keep the existing production key intact. A settings change needs a new preview deployment; the agent can redeploy after configuration.
4. Confirm the controlled synthetic message arrives with the correct reference/attachments; provider acceptance alone is insufficient. No main merge is allowed while a mandatory gate fails.

## R2 audit conclusion

Zenki Hub's private backup design was deferred, not proof of an active backup bucket. The separate historical public media object currently returns HEAD 200 (95,260,132 bytes), matching the known media archive. Earlier object-scoped S3 evidence recorded a delete-after-30d policy; the present public HEAD does not prove the full current lifecycle, account association or billing status. The store account's R2 API still reports 10042 (R2 disabled). Therefore R2 is not verified reusable for this account and public media is categorically unsuitable for private CAD/PII. No activation or public-bucket reuse was attempted.

Sources: https://developers.cloudflare.com/d1/platform/limits/ ; https://developers.cloudflare.com/d1/platform/pricing/ ; https://developers.cloudflare.com/d1/worker-api/d1-database/#batch ; https://developers.cloudflare.com/d1/worker-api/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://resend.com/pricing.md . Provider limits can change; the account's actual plan/permissions must be checked independently.
