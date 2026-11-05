// Run: node scripts/check-gearbox.mjs — fails if the gear teeth ever overlap, or a frame throws.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(
  `export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) { if (s.startsWith(".")) return next(s + ".ts", c); throw e; } }`
));
const g = await import("../src/components/hero-hairline/gearbox.ts");

const inside = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const P1 = g.profile(g.N1), P2 = g.profile(g.N2);
let worst = 0;
for (let k = 0; k < 2000; k++) {
  const [a, b] = g.angles((k / 2000) * (2 * Math.PI) / g.N1 * 3);
  const A = g.gearXY(P1, g.X1, a), B = g.gearXY(P2, g.X2, b);
  const hits = A.filter((p) => inside(p, B)).length + B.filter((p) => inside(p, A)).length;
  worst = Math.max(worst, hits);
}
if (worst) throw new Error(`teeth overlap: ${worst} vertices inside the other gear`);
for (let t = 0; t < g.CYCLE; t += 0.05) if (!g.frame(t).length && t > 0.2 && t < 15.5) throw new Error(`empty frame at ${t}`);
console.log("ok: no tooth overlap over 3 tooth pitches; every frame draws");
