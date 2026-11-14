# Interactive Automotive Keytags viewer

The Automotive customizer now has a real Three.js viewer for every valid Mercedes registration. Other manufacturers keep their explicitly labeled SVG concepts and inquiry workflow. This change is independent of the unresolved Cloudflare CPU/email release gates; production remains held.

## Reuse and geometry

The existing Custom Key Tag scene was audited first: `KeyTagScene.tsx` uses React Three Fiber Canvas, Drei OrbitControls, a 32-degree perspective camera, mobile DPR 1, no postprocessing, ambient light and three directional lights. The Automotive scene uses those same installed components and lighting values, with aspect-aware framing and explicit Front, Back, Side and Reset View controls. The original Custom viewer, geometry and exporter files are unchanged.

`src/lib/cad/automotive.ts` now separates `buildAutomotiveGeometry` from `exportAutomotiveGeometry`; `generateAutomotive` remains the compatible wrapper. The Boolean recipe, sculpted Mercedes source and dimensions did not change. The displayed body/accent solids are the exact source for the multipart 3MF. The complete union is retained for STL export. Export snapshots clone geometry synchronously before async ZIP work, so an obsolete display can be disposed without breaking an in-flight package. Filament colors and metadata are applied at export time. Archives remain UNSLICED geometry, not automatic print projects.

The body uses flat face shading to avoid lighting artifacts across coplanar back triangles. This changes renderer normals only; it does not edit geometry. The emblem keeps the original sculpted ridge surfaces. Back viewing uses a camera behind the actual mirrored branding, with the hole appearing on the right.

## Lifecycle and accessibility

- OrbitControls provides mouse/touch rotation, scroll zoom and two-finger pinch. Pan is disabled, with bounded zoom and aspect-aware fit.
- Front/Back/Side/Reset View buttons are keyboard accessible, minimum 44 px tall and wrap on narrow screens. Focus the viewer and use F/B/S/R as alternatives.
- There is no automatic rotation or view animation. Reduced motion disables damping. Demand rendering avoids an idle animation loop; mobile DPR is 1, desktop capped at 1.5.
- The viewer is dynamically imported without SSR. CAD/WASM loading begins when its region approaches the viewport. The SVG font helper is split out of the catalog's initial module graph.
- Geometry keys contain brand, normalized registration, shape, border and branding. Colors, camera, contact fields and notes do not trigger builds. A 350 ms debounce and serial queue discard obsolete requests/results.
- Ownership cleanup disposes both meshes, materials and the complete union. The renderer owns the single WebGL context and releases it on unmount. Read-only canvas diagnostics support camera/GPU regression checks.
- Updating geometry disables package preparation until the displayed selection matches. Errors keep customer selections and prepared files. WebGL failure is explained; lost-context captures are refused rather than submitting a blank/stale preview.

## Validation

`source/check-viewer-cad.cjs` checks 16 combinations: both shapes, four borders and two registration lengths. It verifies watertight serialized 3MF/STL, exact displayed/exported geometry fingerprints, unchanged STL bytes against eight earlier validated samples, color-only invariance, five expected resource disposals and an export completing after the old display is disposed. All 70 customer-approved export hashes and the original Mercedes source remain unchanged.

`source/check-viewer-browser.cjs` uses actual Chromium/WebGL, with touch emulation. It covers 320/390/768/1024/1440 px, all eight shape/border combinations at each width, mouse/touch rotation, wheel/pinch zoom, view orientations/reset, recoloring without geometry replacement, rapid registration input, single WASM load, two live GPU geometries, brand switching, reduced motion and context-loss recovery. Browser captures come from the real renderer. It sends no valid live submission or email.

`source/check-fitting.cjs` now checks the 15 conceptual SVG brands (1,200 cases). Mercedes is covered by the solid/viewer tests instead of pretending it still uses an SVG hero. `contact-sheet.cjs` captures all 16 actual website renderers, including interactive Mercedes. Existing shared submission browser tests also cover package preparation/capture and the original Custom Key Tag workflow using the real local D1 handler and a mocked provider.

Evidence lives in `reports/viewer/`: CAD parity, preservation, local browser/submission/fitting results and deployed `live/` screenshots/results. Commands reuse the existing installed Playwright module through PLAYWRIGHT_MODULE. Browser tests accept PREVIEW_URL, QA_REPORT_DIR and optional VIEWER_WIDTHS. Do not run valid live submissions without the existing controlled-test authorization and release safeguards.

The viewer's verified state does not qualify production order intake. The separate release blockers and owner setup remain in D1_STORAGE.md and reports/d1-storage/release-gates.json. No production merge, physical printing, real email or new paid service is authorized by this viewer task.
