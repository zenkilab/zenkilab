import type { ManifoldToplevel } from 'manifold-3d';

let pending: Promise<ManifoldToplevel> | undefined;
/** Lazy browser-only WASM. Keep this import out of Cloudflare Functions. */
export function solidKernel(): Promise<ManifoldToplevel> {
  if (!pending) {
    const url = typeof window === 'undefined' ? 'manifold-3d/manifold.js' : '/cad-kernel/manifold.js';
    pending = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
      .then(async ({ default: initialize }) => {
        const kernel = await initialize();
        kernel.setup();
        return kernel as ManifoldToplevel;
      }).catch(error => { pending = undefined; throw error; });
  }
  return pending;
}

