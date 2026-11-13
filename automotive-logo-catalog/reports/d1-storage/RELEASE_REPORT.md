# D1-only release review — production held

The shared D1 BLOB implementation is on the feature branch. R2 is optional and was not activated. **The complete $0 CAD/email workflow fails mandatory release gates. Main and production remain unchanged.**

## Verified changes

- Both existing product endpoints share the same storage, validation, idempotency and Resend service. No second CAD/email pipeline or runtime dependency was added.
- Private D1 file metadata and 256 KiB BLOB chunks are written in one transaction. Default logical capacity is 64 MiB; file/package limits are 3/4 MiB. SHA-256 reconstruction, authentication, quota guards and 30-day retention are implemented.
- All file sizes are checked before expensive archive validation. Partial writes roll back; retries preserve the reference and complete files. Missing email configuration yields a durable pending receipt, never delivery success.
- Both UIs retain prepared files after JSON and HTML platform failures. Automotive exposes a copyable persisted reference while mail is pending.
- The optional legacy R2 adapter requires explicit backend selection and authorization. No public media bucket or new paid service is used.

These are logical limits, **not proven safe sizes on Workers Free**. The runtime blocker below prevents production use of full CAD packages.

## Actual remote evidence

[remote-inquiry.json](remote-inquiry.json) passes **11 real Cloudflare/D1 cases** using an 11,840-byte preview: durable upload, exact private retrieval, unauthorized rejection, duplicate suppression, checksum corruption rejection/repair, transactional file-chunk failure/retry, capacity guard, CAD-pending inquiry, missing-key handling and retention. Tests used a preview-only authenticated mail hold. No email provider was mocked in these remote tests and no email was sent.

Full CAD initially completed several real uploads and multi-chunk retrieval/rollback checks, but repeated runs fail. A 508,039-byte inquiry preview also fails. [runtime-failure.json](runtime-failure.json) records the live Pages diagnostic: **Exceeded CPU Limit — Worker exceeded CPU time limit**. Failure responses and request correlation IDs are retained in [remote-cad-resource-failure.json](remote-cad-resource-failure.json) and [remote-large-inquiry-cpu-failure.json](remote-large-inquiry-cpu-failure.json). Do not interpret earlier intermittent successes as reliable operation.

The current one-request validation/large-file processing must be made to fit the Free runtime, for example through bounded stages, and fully retested without reducing server checks. A paid upgrade is not authorized. Small-request persistence does not qualify the complete CAD workflow.

All synthetic files and personal payloads were cleaned afterward. [account-audit.json](account-audit.json) shows zero remaining file rows/chunks and zero logical attachment bytes. The preview database occupies 98,304 bytes after cleanup. Existing production D1 has the additive migration, three storage tables, the distinct production namespace and zero submissions; it remains unbound to Pages.

## Regression evidence

| Check | Result |
|---|---|
| Build, types, Pages Function bundle, existing hairline regression | PASS |
| D1 local transaction/recovery/limits groups | 16 PASS; email mocked |
| Legacy adapter submission scenarios | 24 PASS; email mocked |
| Custom quote/confirm, Mercedes generation, pending-brand inquiry and retry UI | PASS locally over the shared HTTP handler; email mocked |
| Font measurements | 43 PASS |
| CAD configurations / independently reloaded pairs | 26 / 12 PASS |
| Actual offline Bambu Studio P2S slices | 14 PASS; no printing/network upload |
| Deployed logo fitting | 1,280 PASS across 16 brands and five widths |
| Approved Mercedes export hashes | All 70 unchanged |
| Reliable full CAD submission on the current remote runtime | FAIL |
| Actual Resend acceptance and inbox delivery | NOT VERIFIED |

See [regression-summary.json](regression-summary.json), [browser.json](browser.json), [cad-matrix.json](cad-matrix.json), [independent-cad.json](independent-cad.json) and [slicer-results.json](slicer-results.json). Original synthetic sample geometry and slicer artifacts remain in `../production-sprint/cad/` and `../production-sprint/slicing/`. Customer-approved geometry was not regenerated.

Responsive evidence: [320 px](responsive/live-viewport-320.png), [390 px](responsive/live-viewport-390.png), [768 px](responsive/live-viewport-768.png), [1024 px](responsive/live-viewport-1024.png), [1440 px](responsive/live-viewport-1440.png), [16-brand contact sheet](responsive/all-16-contact-sheet.png). Local submission screenshots are in `submission-browser/`.

## Release gates

| Gate | Status |
|---|---|
| G0 — independently verified $0 account configuration | FAIL — billing API 403; owner confirmation missing |
| G1 — build/types/local regression | PASS |
| G2 — existing Custom Key Tag complete remote workflow | FAIL — CPU reliability/email unverified |
| G3 — offline CAD/manufacturing checks | PASS |
| G4 — complete real D1 submission lifecycle | FAIL — small inquiries pass; full CAD/larger previews unreliable |
| G5 — complete recovery/idempotency at actual payload sizes | FAIL — local/small remote pass; runtime blocker remains |
| G6 — live Resend configuration/acceptance | FAIL — Preview secret missing |
| G7 — authorized real delivery | FAIL — no email sent; authorization remains unused |
| G8 — responsive catalog and controls | PASS |
| G9 — private access/integrity/cleanup | PASS for tested paths |
| G10 — production bindings/operations/rollback | FAIL — production preparation incomplete |

[release-gates.json](release-gates.json) is authoritative. R2 is no longer a mandatory gate. Production main remains `4c6f3fd741d26026f234be067a5284c763312a0c`; no merge or production deployment occurred.

## R2 conclusion and owner steps

Zenki Hub's private backup design was deferred. The historical public media object still returns HEAD 200, but its present account association, lifecycle and billing are not verified. The store account reports R2 disabled (10042). It is not verified reusable, and public media storage is unsuitable for private CAD/PII. Nothing was activated or reused.

1. In Cloudflare, open Manage Account → Billing → Subscriptions and confirm Workers Free. Do not upgrade or add a payment method.
2. Open [Resend Billing](https://resend.com/settings/billing) and confirm Free. Do not enable paid overages.
3. Open [Pages project zenkilab](https://dash.cloudflare.com/981c8c76bc6db02b1f2534e7054a7536/pages/view/zenkilab) → Settings → Variables and Secrets → **Preview**. Add the existing `RESEND_API_KEY` as Secret/Encrypt. Do not paste it into chat or change Production. The agent could not inspect account billing with the authorized token.
4. After Free-runtime remediation and provider setup, run the one already-authorized synthetic business-recipient email and independently confirm inbox arrival, reference and attachments. Provider API acceptance alone is insufficient.

Owner email/plan setup does not resolve the CPU engineering blocker. Production binding, retention scheduling, backup and a compatible rollback rehearsal also remain mandatory. The feature preview stays unlisted/noindexed. No payments, customer messages or physical printing were triggered.

Current branch: `feature/automotive-keytags-logo-catalog`. The exact scoped changed-file inventory is [changed-files.json](changed-files.json); final deployment/commit details are reported separately after push verification.
