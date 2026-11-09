# Zenki Lab website

The site for [zenkilab.com](https://zenkilab.com): Zenki Lab's custom 3D printing service and its store (key tags, dog tags, name tags, chibi figures). Next.js 16 (App Router), React 19, Tailwind v4, built as a static export.

Read these before changing anything:

- [AGENTS.md](AGENTS.md): this Next.js version differs from older ones (read `node_modules/next/dist/docs/` first), and the SEO rule every page follows.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): colour, type, layout patterns and how the homepage hero works.
- [BUSINESS_CONTEXT.md](BUSINESS_CONTEXT.md): what the business does and does not do, and how the site should talk about it.

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000 (add -- -p 3007 for another port)
```

## Check before pushing

```bash
npx tsc --noEmit                     # types
npx eslint <files you changed>       # lint (a few older files still have errors; don't add new ones)
node scripts/check-hairline.mjs      # after touching src/components/hero-hairline: every hero and story frame must draw
npm run build                        # static export into out/
```

To see the export the way the live site serves it: `python -m http.server 8766 --directory out`, then open http://127.0.0.1:8766. On that server, `/store/` style links and the `__next.*.txt` prefetch files return 404; the live host serves both, so ignore those.

## Deploy

Pushing to `main` deploys. The GitHub Actions workflow [deploy.yml](.github/workflows/deploy.yml) runs `npm run build` and publishes `out/`; zenkilab.com is served through Cloudflare. Work happens on a branch and reaches `main` once it builds and passes the checks above.

## Releases and rollback

| What | Where |
|---|---|
| Live since 2026-11-09: the 2.5D "Ink & Tone" hero | `main`, from branch `feat/hero-2-5d` |
| The site before that, with the Three.js 3D hero | branch `archive/main-3d-hero-2026-11-09` and tag `site-3d-hero-final` (both at `89aed05`) |

To bring the old hero back, either:

- set `DEFAULT_HERO = "three"` in [src/lib/constants.ts](src/lib/constants.ts) (the 3D hero's code is still in the project), or
- put the whole old site back: `git push --force origin site-3d-hero-final:main`. This throws away everything after it on `main`, so do it only on purpose.
