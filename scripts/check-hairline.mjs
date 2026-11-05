// Run: node scripts/check-hairline.mjs — fails if gear teeth overlap, a job's layer paths break,
// or any hero/story frame throws or draws nothing.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(
  `export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) { if (s.startsWith(".")) return next(s + ".ts", c); throw e; } }`
));
const dir = "../src/components/hero-hairline/";
const jobs = await import(dir + "jobs.ts"), parts = await import(dir + "parts.ts");
const hero = await import(dir + "hero.ts"), story = await import(dir + "story.ts"), journey = await import(dir + "journey.ts");
const fail = (m) => { throw new Error(m); };

// 1. the gears mesh without touching, over three pitches of the small gear
const inside = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const [P1, P2] = jobs.PROFILES;
for (let k = 0; k < 2000; k++) {
  const [a, b] = jobs.angles(((k / 2000) * 2 * Math.PI * 3) / jobs.N1);
  const A = jobs.gearXY(P1, jobs.X1, a), B = jobs.gearXY(P2, jobs.X2, b);
  if (A.some((p) => inside(p, B)) || B.some((p) => inside(p, A))) fail(`teeth overlap at step ${k}`);
}

// 2. every job prints: each layer has closed, non-empty paths
for (const job of Object.values(jobs.JOBS)) {
  const H = jobs.jobHeight(job), n = Math.round(H / job.pitch);
  if (Math.abs(n * job.pitch - H) > 1e-6) fail(`${job.id}: height ${H} is not a whole number of ${job.pitch} layers`);
  for (let i = 1; i <= n; i++) {
    const paths = parts.layerPaths(job.blocks, i * job.pitch - 1e-3);
    if (!paths.length || paths.some((p) => p.length < 2)) fail(`${job.id}: layer ${i} has no path`);
  }
}

// 3. every frame draws, with no NaN, and the queue shows a store product
const view = { az: 0, k: 0, lift: 0, dx: 0 }, ok = (items, at) => {
  if (!items.length) fail(`empty frame at ${at}`);
  if (items.some((it) => it.d.includes("NaN"))) fail(`NaN in frame at ${at}`);
};
// at rest and at the corners of the pointer's tilt (±5°, ±0.035) plus the hero's drift
const views = [view, ...[-1, 1].flatMap((a) => [-1, 1].map((k) => ({ az: a * 5, k: k * 0.035, lift: 0, dx: 0 })))];
for (const v of views) {
  for (let t = 0; t < hero.CYCLE; t += 0.05) { ok(hero.frame(t, v), `hero ${t.toFixed(2)} ${JSON.stringify(v)}`); hero.caption(t); }
  for (let p = story.P_MIN + 0.01; p <= 1.0001; p += 0.005) { ok(story.frame(p, v), `story ${p.toFixed(3)} ${JSON.stringify(v)}`); story.caption(p); }
  // the hand-off: hero leaving while the request arrives, at several points in the hero's loop
  for (let x = 0; x <= 1.0001; x += 0.02) for (const t of [0, 5.6, 13, 21.8]) { ok(journey.frame(t, v, { x, p: 0 }), `hand-off x ${x.toFixed(2)} t ${t}`); journey.caption(t, { x, p: 0 }); }
}
let store = false;
for (let t = 0; t < hero.CYCLE; t += 0.5) store ||= hero.caption(t).includes("ZENKI STORE");
if (!store) fail("no store product in the hero queue");
console.log(`ok: gears mesh clean; ${Object.keys(jobs.JOBS).length} jobs print; hero ${hero.CYCLE.toFixed(1)} s and story frames all draw`);
