> Historical baseline at 9743df1. Current manufacturing/storage evidence and release gates are in ../production-sprint/ and ../../PRODUCTION_RELEASE.md.

# Shared workflow verification

Implemented on feature/automotive-keytags-logo-catalog. Working application code verified at 92e2254dfa6d8ff61d7c7bd7a6bdcc0ce6c52f2c. No main deployment or real email was triggered.

Both Custom Key Tag and Automotive use the shared Pages Function service, D1 state adapter, private R2 attachment adapter and existing Resend business recipient. Existing Custom Key Tag CAD/exporter remains unchanged. Automotive generates Mercedes registrations with the original sculpted reference, two shapes, four borders, two filament assignments and mirrored flush back branding. Other brands prepare inquiries with no CAD claim.

- Production build, TypeScript and Function compilation: pass.
- Shared function: 21 scenario groups pass, using real SQLite/private filesystem persistence and a mocked Resend boundary. Includes quote and confirmation for the existing product, eight Mercedes shape/border packages, Toyota inquiry, concurrent duplicate suppression, retained retry attachments, storage/provider failures, oversized/invalid inputs, empty STL rejection, namespace guard, rate limits, expiry cleanup and SQLite reopen.
- Pure shared font metrics: 43 registrations match the previous Three.js FontLoader measurements. No Three.js runtime import on the server configuration path.
- Actual browser UI and shared Function over local HTTP: Custom Key Tag, changed-registration Mercedes, inquiry and five responsive widths pass. The provider is mocked.
- Live branch browser: HTTP 200 at 320/390/768/1024/1440 px, no overflow or browser errors. Mercedes NEW 1234 creates a client CAD package; Toyota inquiry preparation works; Custom Key Tag loads.
- Live readiness GET: HTTP 503, missing RESEND_API_KEY, SUBMISSIONS_DB, SUBMISSIONS_FILES, SUBMISSION_NAMESPACE and SUBMISSION_ALLOWED_HOSTS. Empty legacy form returns a clear 503. No valid live submission was attempted.

Live customer preview: https://feature-automotive-keytags-l.zenkilab.pages.dev/preview/automotive-keytags/zgK-bGNzkybwN8aPd8e_26sDpxL0GRCX

See live.json and browser.json for machine-readable browser evidence, results.json for actual server receipts/mesh warnings, approved-geometry-preservation.json for original export hashes, and changed-files.json for the exact scoped file list.

## Remaining release gates

R2 is not enabled on the Cloudflare account (API 10042); D1 listing was empty. No billing activation or paid-plan change was made. Remote D1/R2 persistence/recovery and real Resend acceptance/delivery are unverified. Configure the isolated preview bindings using ../../SHARED_SUBMISSION_WORKFLOW.md, then redeploy and verify readiness. Cleanup must be scheduled explicitly. An approved synthetic live message and provider/delivery evidence are still needed; the prior one-email authorization remains unused.

New generated samples measure 58 x 28 x 3.92 mm including relief (3.2 mm nominal body). Their layered color meshes have boundary/nonmanifold-edge warnings and require Boolean solid/manufacturing review. These files are unsliced geometry archives, not slicer-ready projects. Structural validation is not independent regeneration, minimum-feature certification or full intersection verification. Original approved Mercedes outputs are byte-preserved.

The workflow is implemented and locally tested, but is not production-ready or verified end to end against real remote persistence and email delivery.
