# Custom Key Tag prerequisite audit — Automotive integration not yet implemented

This audit was performed before changing customer-facing or backend product code. The requested Automotive submission integration remains incomplete. No production deployment or real email was triggered. One synthetic email was authorized, but the owner then proposed testing with a later main-branch release; that authorization has not been consumed. No push to main was authorized or performed.

## Actual architecture discovered

1. `/store/key-tag` collects tag content/name or car number, capsule/ring style, corner option, existing two-color combo, back branding, NFC option, batch entries, customer name and WhatsApp number. Browser input validation requires nonblank text, name and at least nine phone digits.
2. `src/components/keytag/geometry.ts` generates Three.js geometry in the browser using the existing typeface and polygon-clipping. `KeyTagScene.tsx` supplies the visual preview/capture. This is not a remote/server CAD service.
3. `src/components/keytag/export3mf.ts` uses `buildPrintGroup`, Three.js, `three-3mf-exporter` and JSZip. It packages one or multiple tags, colors/material assignments and optional NFC pause metadata. The normal quote workflow supplies 3MF, not an STL export.
4. `src/lib/keytag-submit.ts` posts multipart `stage`, JSON order, optional JPEG preview and quote-stage 3MF to `/api/hub/keytag-order`. Thumbnail fields are removed from JSON. Quote data is stored in browser sessionStorage only after sendOrder returns. In development, sendOrder catches and suppresses failed submissions; this is explicitly unsuitable as integration evidence.
5. `functions/api/hub/keytag-order.ts` parses the order using `_lib/keytag-email.ts`, computes business-side specifications/prices and sends direct base64 attachments to Resend. It uses the existing sender/recipient literals in that source, not a recipient environment binding. Any new integration should centralize/reuse that existing destination rather than copy addresses to a new pipeline.
6. Quote-stage model limit is 5 MiB. The 3MF is checked for presence/size, not archive contents, selected configuration fidelity or geometry integrity. Preview is optional and accepted only as a JPEG <=1 MiB; invalid previews are silently skipped.
7. The server requires RESEND_API_KEY. If preview-containing email is rejected, it retries without the preview and can return success without disclosing that omission. It does not store/order-lock submissions, keep model artifacts, return the provider ID or verify inbox delivery.
8. `/store/key-tag/quote` reads sessionStorage and sends a second `confirm` message without the model when the user confirms. This is a second business email/queue signal, not a customer inbox confirmation. No customer email address is collected in this product flow.

## Security/reliability findings

- No server-side CAD generation or durable persistence exists in this path.
- No private CAD storage or secure-download link mechanism exists in this path. General `/api/quote` also emails attachments directly; it is not durable storage.
- No application-level idempotency, rate-limit, Turnstile, origin enforcement or submission authentication was found in these routes. Cloudflare zone-level WAF/rate controls were not independently audited and should not be presumed absent or sufficient.
- Duplicate requests with the same reference generate another provider call.
- The parser truncates contact fields but does not require a valid contact. Invalid tag entries may be dropped; unknown style/corner values are coerced rather than rejected. No explicit maximum tag count was found.
- Generation validation is not performed by the Function. A model named .3mf with invalid bytes is accepted under mocked provider success.
- Quote/confirm success is based on HTTP provider acceptance. The response discards the Resend email ID. Acceptance is not inbox delivery; no delivery webhook/event or recipient acknowledgment is handled.
- Preview retry can silently omit the requested visual attachment. Transport failure paths need explicit, persistent, retryable state before Automotive claims stronger guarantees.

## Executed checks

`source/audit-existing-cad.cjs` calls the actual existing `buildOrder3MF` function with a synthetic TEST 123 capsule configuration. It produced a real 203,119-byte 3MF archive (`general-keytag-test.3mf`). ZIP/XML integrity passes. Independent trimesh inspection reports consistent winding and positive volume but non-watertight color meshes (50 x 25 x 1.6 / 2.6 mm bounds). This is a finding requiring investigation, not a declaration that an existing printer/slicer cannot process it. No physical slicing/printing was performed.

`source/audit-existing-submission.cjs` executes the actual existing Cloudflare handler with synthetic input and mocks only the Resend fetch boundary. It checks missing configuration, missing model, invalid model bytes, duplicate reference behavior, preview-drop retry and provider failure. It also attaches the actual generated 3MF and verifies byte equality after base64 decoding the provider payload. The existing browser helper was executed in development and production modes: development suppresses a failed submission, production throws. Mock acceptance is explicitly not actual delivery verification.

Browser-origin invalid-form probes (no valid order, therefore incapable of sending email):

- Current Cloudflare feature preview: HTTP 500, `Server not configured`. The route checks RESEND_API_KEY first.
- Existing `https://zenkilab.com` endpoint: HTTP 400, `Invalid order`, so it passes that configuration guard. This does not prove the key is valid with Resend or mail is delivered.
- A direct non-browser probe was blocked by Cloudflare with 403/1010; the browser-origin result is the relevant application check.

All results are under `reports/submission-audit/`. No real customer data was used. No secrets were read or printed. No real email was sent.

## Reuse and required changes before implementation can be called complete

Reusable: the existing Cloudflare Functions deployment, Resend provider, email escaping/styled shell, shared order specification conventions, Three.js/typeface geometry components, 3MF exporter and browser submission/payload conventions. The approved Mercedes solid/ridge geometry and its parameter rules must remain authoritative; the general generator's 50 x 25 mm capsule/rim geometry is not a valid replacement for the automotive design.

Missing prerequisites: a server-compatible validated Mercedes CAD provider for arbitrary approved registrations/shapes/borders; robust mesh validation; durable private submission/artifact storage; shared delivery transport that retains provider IDs and fails explicitly on omitted mandatory attachments; persistent idempotency/retry handling and abuse controls. These do not exist as proven services to reuse unchanged. They must be implemented and configured, not simulated by the UI or inferred from a 200 response.

A future Automotive request should be parsed by a server-owned schema and either generate validated geometry or explicitly create an inquiry-only package. Both should use shared persistence and delivery infrastructure, with no frontend-only development-success bypass. CAD-pending requests must retain their selected sourced logo, preview, customer contact and all options, without producing or claiming validated manufacturing files.

## Deployment and verification gate

The owner suggested testing when a later main release is made. This task does not authorize a production release, and production must not be used to conceal a broken preview environment. For complete staging verification, configure the existing Resend secret for the Cloudflare Pages preview environment, configure the necessary private persistence/storage bindings, and run the explicitly authorized synthetic email test with provider receipt plus actual delivery/recipient confirmation. An existing production test could be performed without deploying code if separately scheduled, but no such test has been executed here.

Current status: **audit complete; prerequisite end-to-end delivery/persistence verification failed or unavailable; Automotive CAD/submission integration not implemented and not complete**. The working logo/UI preview is preserved. Do not describe these audit checks as a completed Automotive ordering workflow.
