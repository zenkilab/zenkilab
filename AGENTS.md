<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SEO
Every page must export its metadata through `pageMetadata({ title, description, path })` from `src/lib/seo.ts` (never a hand-written `openGraph`). It sets canonical, Open Graph and Twitter tags, and uses `opengraph-image.{png,jpg,webp}` placed next to the page when present, else the site image. Indexable pages also go in `src/app/sitemap.ts`; private ones get `robots: { index: false }`.
