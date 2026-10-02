// Cloudflare Pages Function: GET /api/site-fonts?url=https://example.com
// Reads a company website and lists the fonts it uses, so the name tag page can match the brand.
// Only fonts that exist on Google Fonts are marked usable, because that is where the page loads them from.
//
// The URL is customer supplied, so every fetch is limited: https only, no IP addresses or internal
// hostnames, redirects re-checked, short timeout, small size cap.

const MAX_BYTES = 1_000_000;
const MAX_SHEETS = 4;
const GENERIC = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "inherit", "initial", "unset", "emoji", "math", "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica", "helvetica neue", "arial", "times new roman", "georgia", "tahoma", "verdana", "courier new"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } });

function allowed(u: URL) {
  const h = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || u.port) return false;
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false; // IPv4 / IPv6 literals
  return true;
}

async function safeText(start: URL): Promise<{ text: string; url: URL } | null> {
  let u = start;
  for (let hop = 0; hop < 4; hop++) {
    if (!allowed(u)) return null;
    const res = await fetch(u.toString(), { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "ZenkiLabBot/1.0 (+https://zenkilab.com)" } });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      u = new URL(loc, u);
      continue;
    }
    if (!res.ok) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES * 3) return null;
    return { text: (await res.text()).slice(0, MAX_BYTES), url: u };
  }
  return null;
}

const clean = (s: string) => s.trim().replace(/^['"]|['"]$/g, "").trim();

export const onRequestGet = async ({ request }: { request: Request }) => {
  const raw = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  let site: URL;
  try {
    site = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return json({ error: "Enter a website address like example.com." }, 400);
  }
  if (!allowed(site)) return json({ error: "Enter a public https website address." }, 400);

  try {
    const page = await safeText(site);
    if (!page) return json({ error: "Could not open that website." }, 502);

    const counts = new Map<string, number>();
    const add = (name: string, weight = 1) => {
      const n = clean(name);
      if (!n || n.length > 40 || GENERIC.has(n.toLowerCase()) || /var\(|\(|icon|awesome|symbol|glyph|emoji|fallback/i.test(n)) return;
      counts.set(n, (counts.get(n) ?? 0) + weight);
    };
    const scan = (css: string) => {
      for (const m of css.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) m[1].split(",").forEach((f) => add(f));
      for (const m of css.matchAll(/@font-face\s*\{[^}]*?font-family\s*:\s*([^;}]+)/gi)) add(m[1], 2);
    };

    // Google Fonts links name the font directly, so they count most.
    const html = page.text;
    for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'<>\s]+)/gi))
      for (const f of m[1].replace(/&amp;/g, "&").matchAll(/family=([^&:;]+)/g)) add(decodeURIComponent(f[1]).replace(/\+/g, " "), 5);

    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) scan(m[1]);

    const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
      .map((m) => /href=["']?([^"'\s>]+)/i.exec(m[0])?.[1])
      .filter((h): h is string => !!h && !h.includes("fonts.googleapis.com"))
      .slice(0, MAX_SHEETS);
    for (const h of sheets) {
      try {
        const css = await safeText(new URL(h.replace(/&amp;/g, "&"), page.url));
        if (css) scan(css.text);
      } catch { /* one bad stylesheet should not fail the lookup */ }
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
    const fonts = await Promise.all(
      ranked.map(async (name) => {
        const r = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@500;600&display=swap`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
        return { name, available: !!r?.ok };
      }),
    );
    return json({ site: page.url.hostname, fonts });
  } catch {
    return json({ error: "Could not read that website. Try again, or pick a font below." }, 502);
  }
};
