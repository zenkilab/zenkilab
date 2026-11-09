/**
 * The planes either side of the drawing, for depth: behind it, the workshop
 * (two walls, a shelf of filament, a pegboard of tools); in front, a gear and
 * the customer's file card floating near the viewer. Both are drawn once, with
 * the hero's resting camera, and only ever moved by CSS (parallax), so they
 * cost nothing per frame. The back plane is drawn in a 800 × 640 box that
 * centres on the main 400 × 320 one (see BACK_BOX).
 */
import { circ, hull, open, poly, proj, rrect, seg, type Vec2 } from "./hairline";
import { JOBS, gearXY, profile } from "./jobs";
import { add, at, cylinder, faded, light, off, placed, prismAt, stlWire, type Item, type Pen } from "./parts";
import { restCam } from "./hero";

/** The back plane's viewBox: twice the main one, same centre and scale. */
export const BACK_BOX = "-200 -160 800 640";

const pen = (): Pen => {
  const C = restCam(), s = Math.sin(C.az), c = Math.cos(C.az);
  return { P: proj(C), front: (q) => q.nu * s + q.nv * c >= -1e-6, lit: light(C), o: 1, out: [] };
};
const slab = (pn: Pen, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  prismAt(pn, rrect(x0, y0, x1, y1, 0.5, 1), z0, z1);

/** A spool standing on its flange: flange, wound filament with its turns showing, flange. */
function spool(pn: Pen, x: number, y: number, z: number) {
  const fl = off(circ(17, 40), x, y), core = off(circ(13.5, 40), x, y);
  cylinder(pn, fl, z, z + 2.5);
  cylinder(pn, core, z + 2.5, z + 16.5);
  const f = core.filter((q) => pn.front(q));
  let d = "";
  for (let k = z + 4; k < z + 16; k += 1.6) d += open(at(pn, f, k));
  add(pn, d, "nf lo");
  cylinder(pn, fl, z + 16.5, z + 19);
  add(pn, poly(at(pn, off(circ(4, 20), x, y), z + 19)), "nf lo");
}

export function back(): Item[] {
  const pn = pen();
  // the walls meet behind the bed; a fade (CSS) lets them dissolve into the page
  slab(pn, -150, -120, -40, 150, -116, 130);
  slab(pn, -154, -116, -40, -150, 160, 130);
  // filament shelf on the back wall, behind the printer
  slab(pn, -146, -116, 22, 70, -86, 26);
  [-126, -84, -42, 0, 42].forEach((x) => spool(pn, x, -101, 26));
  // storage bins on the shelf above
  slab(pn, -146, -116, 80, 70, -90, 84);
  [[-140, 30], [-104, 40], [-58, 30], [-22, 44], [28, 36]].forEach(([x, w]) => slab(pn, x, -114, 84, x + w, -92, 102));
  // pegboard and tools on the side wall
  slab(pn, -150, -86, 26, -146, 110, 126);
  let holes = "";
  for (let y = -78; y <= 102; y += 12) for (let z = 34; z <= 120; z += 12) {
    const [u, v] = pn.P(-145.8, y, z);
    holes += `M${u.toFixed(1)} ${v.toFixed(1)}h.01`;
  }
  add(pn, holes, "nf peg");
  slab(pn, -146, -64, 44, -143, -58, 108); // a steel rule
  slab(pn, -146, -38, 70, -143, -26, 112); // a spatula: blade, then handle
  slab(pn, -146, -34, 46, -143, -30, 70);
  slab(pn, -146, 4, 80, -143, 40, 86); // calipers: beam and two jaws
  slab(pn, -146, 6, 64, -143, 10, 80);
  slab(pn, -146, 30, 66, -143, 34, 80);
  slab(pn, -146, 66, 58, -143, 72, 110);
  return pn.out;
}

/** A flat gear, `t` thick, lying at height z. */
function gear(pn: Pen, x: number, y: number, z: number, N: number, t: number, th: number) {
  const xy = gearXY(profile(N), 0, th).map(([u, v]) => [u + x, v + y] as Vec2);
  const ring = (k: number) => xy.map(([u, v]) => pn.P(u, v, k));
  add(pn, poly(ring(z)), "lo");
  for (let j = 1; j < 4; j++) add(pn, poly(ring(z + (t * j) / 4)), "fo");
  add(pn, poly(ring(z + t)), "sil ttk");
  cylinder(pn, off(circ(5, 24), x, y), z + t, z + t + 2.5);
}

export function front(): Item[] {
  const pn = pen();
  // a spare gear drifting up at the front left
  gear(pn, 63, 176, 40, 14, 4, 0.2);
  // the customer's file: a card with a folded corner and the part's mesh
  const card = placed(pn, 150, 150, 30, 1.15);
  const outline: Vec2[] = [[-17, -22], [9, -22], [17, -14], [17, 22], [-17, 22]];
  const top = outline.map(([u, v]) => card.P(u, v, 1.2)), base = outline.map(([u, v]) => card.P(u, v, 0));
  add(card, poly(hull(top.concat(base))), "sil");
  add(card, poly(top), "tt");
  add(card, poly(top), "nf");
  add(card, seg(card.P(9, -22, 1.2), card.P(9, -14, 1.2)) + seg(card.P(9, -14, 1.2), card.P(17, -14, 1.2)), "nf");
  stlWire(faded(placed(card, 0, -2, 1.2, 0.22), 1), JOBS.bracket.blocks, 1);
  add(card, seg(card.P(-12, 17, 1.2), card.P(8, 17, 1.2)), "nf amb");
  return pn.out;
}
