/**
 * The workshop's drawing kit, all pure: given a pen, each function appends
 * paths in Hairline's manner (opaque plates, painted back to front). Scenes
 * (hero.ts, story.ts) compose these; jobs.ts describes what gets printed.
 */
import {
  bezier, circ, clamp, fit, hull, open, poly, proj, ringAt, rrect, run, seg,
  type Camera, type Projector, type Ring, type Sample, type Vec2, type Vec3,
} from "./hairline";

export type Item = { d: string; c: string; o: number };
/** The camera's nudges: azimuth (deg) and elevation from the pointer, and a screen offset (viewBox units). */
export type View = { az: number; k: number; lift: number; dx: number };

/** Where paths go: a projector, the facing test, the key light, and an opacity that multiplies everything drawn. */
export type Pen = { P: Projector; front: (q: Sample) => boolean; lit: (q: Sample) => number; o: number; out: Item[] };

/**
 * The key light, fixed to the camera so the look never changes as the view
 * drifts: from the viewer's upper left. Returns how much a side facing q
 * catches it, 0 to 1.
 */
export function light(C: Camera) {
  const s = Math.sin(C.az), c = Math.cos(C.az);
  const lx = 0.55 * s - 0.84 * c, ly = 0.55 * c + 0.84 * s; // toward the viewer (s, c) and screen left (-c, s)
  return (q: Sample) => Math.max(0, q.nu * lx + q.nv * ly);
}

const band = (l: number) => (l > 0.62 ? "tl" : l > 0.22 ? "tm" : "");

/**
 * Tone: the visible sides of a solid in up to two lit tones (the plate under
 * them is the shadow tone), then its top, lightest, with any holes left open.
 * Drawn over the silhouette plate and under the solid's lines.
 */
export function tone(pen: Pen, ring: Ring, z0: number, z1: number, top = true, holes: Ring[] = []) {
  const f = run(ring, pen.front);
  const cls = (i: number) => band(pen.lit({ u: 0, v: 0, nu: (f[i].nu + f[i + 1].nu) / 2, nv: (f[i].nv + f[i + 1].nv) / 2 }));
  for (let i = 0; i < f.length - 1;) {
    const c = cls(i);
    let j = i + 1;
    while (j < f.length - 1 && cls(j) === c) j++;
    if (c) { const s = f.slice(i, j + 1); add(pen, poly(at(pen, s, z0).concat(at(pen, s, z1).reverse())), c); }
    i = j;
  }
  if (top) add(pen, poly(at(pen, ring, z1)) + holes.map((h) => poly(at(pen, h, z1))).join(""), "tt");
}

/**
 * Hairline's `fit` centres but never scales. This also scales: up to `maxS`,
 * and down so the points span at most `maxW` viewBox units across, whatever
 * angle the camera has drifted or been tilted to.
 */
export function frameTo(C: Camera, pts: readonly Vec3[], maxS: number, maxW: number, cx: number, cy: number) {
  C.S = 1;
  const xs = pts.map((q) => proj(C)(q[0], q[1], q[2])[0]);
  C.S = Math.min(maxS, maxW / (Math.max(...xs) - Math.min(...xs)));
  fit(C, pts, cx, cy);
}

export const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const inout = bezier(0.65, 0, 0.35, 1);

export function add(pen: Pen, d: string, c: string, o = 1) {
  o *= pen.o;
  if (d && o > 0.01) pen.out.push({ d, c, o: Math.round(o * 100) / 100 });
}
/** The same pen, faded. */
export const faded = (pen: Pen, o: number): Pen => ({ ...pen, o: pen.o * o });
/** The same pen, with everything moved by (dx, dy, dz) and scaled by s about the local origin. */
export const placed = (pen: Pen, dx: number, dy: number, dz: number, s = 1): Pen =>
  ({ ...pen, P: (x, y, z) => pen.P(dx + x * s, dy + y * s, dz + z * s) });

export const at = (pen: Pen, r: Ring, z: number) => ringAt(pen.P, r, z);
export const off = (ring: Ring, dx: number, dy: number): Ring => ring.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));
export const closed = (pts: Vec2[]): Vec2[] => [...pts, pts[0]];
export const ringXY = (r: Ring): Vec2[] => closed(r.map((q) => [q.u, q.v] as Vec2));

/** The first fraction f of a polyline, by length. */
export function trace(pts: Vec2[], f: number): Vec2[] {
  if (f <= 0 || pts.length < 2) return [];
  if (f >= 1) return pts;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * f;
  const out: Vec2[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l >= left) { out.push([a[0] + ((b[0] - a[0]) * left) / l, a[1] + ((b[1] - a[1]) * left) / l]); break; }
    out.push(b); left -= l;
  }
  return out;
}

/** A plain rounded solid from z0 to z1: bright silhouette, one dim crease along its front top edge. */
export function prismAt(pen: Pen, ring: Ring, z0: number, z1: number, c = "sil") {
  if (z1 - z0 < 0.05) return;
  add(pen, poly(hull(at(pen, ring, z1).concat(at(pen, ring, z0)))), c);
  tone(pen, ring, z0, z1);
  add(pen, open(at(pen, run(ring, pen.front), z1)), "nf");
}
/** A cylinder whose whole top shows: shafts, hubs, bosses. */
export function cylinder(pen: Pen, ring: Ring, z0: number, z1: number) {
  if (z1 - z0 < 0.05) return;
  add(pen, poly(hull(at(pen, ring, z1).concat(at(pen, ring, z0)))), "sil");
  tone(pen, ring, z0, z1);
  add(pen, poly(at(pen, ring, z1)), "nf");
}

/* ---------- printed solids ---------- */

/**
 * One printable body. `ring` is its footprint from z0 to z1. A `cavity` makes
 * it an open tray (floor at `cavity.floor`); `inside` are bodies standing on
 * that floor, painted before the near wall. `holes` go straight through.
 */
export type Block = {
  ring: Ring; z0: number; z1: number;
  holes?: Ring[];
  cavity?: { ring: Ring; floor: number };
  inside?: Block[];
};

/**
 * Draws a block printed up to height h. `layers` adds the print-layer lines
 * every `pitch`; `contents` paints whatever sits in a tray (gears, a part in
 * a parcel) before the near wall hides its lower edge.
 */
export function block(pen: Pen, b: Block, h: number, pitch: number, layers: boolean, contents?: () => void) {
  const hb = Math.min(h, b.z1);
  if (hb - b.z0 < 0.05) return;
  const fo = run(b.ring, pen.front);
  const lines = () => { if (layers) for (let z = b.z0 + pitch; z < hb - 0.01; z += pitch) add(pen, open(at(pen, fo, z)), "nf lo"); };
  add(pen, poly(hull(at(pen, b.ring, hb).concat(at(pen, b.ring, b.z0)))), "sil");
  const cav = b.cavity;
  if (!cav || hb <= cav.floor + 0.05) {
    tone(pen, b.ring, b.z0, hb, true, b.holes);
    lines();
    add(pen, open(at(pen, fo, hb)), "nf");
    for (const r of b.holes ?? []) add(pen, poly(at(pen, r, hb)), "nf");
    contents?.();
    return;
  }
  // an open tray: the opening and the whole rim, the far floor edge, what stands inside, then the near wall and near rim over it.
  // The far rim goes down first so that anything lifted above it (gears dropping in, parts standing in a slot) is drawn over it.
  add(pen, poly(at(pen, cav.ring, hb)), "tin");
  add(pen, poly(at(pen, b.ring, hb)) + poly(at(pen, cav.ring, hb)), "tt");
  const fb = run(cav.ring, (q) => !pen.front(q)), e0 = fb[0], e1 = fb[fb.length - 1];
  add(pen, open(at(pen, fb, cav.floor)) + seg(pen.P(e0.u, e0.v, hb), pen.P(e0.u, e0.v, cav.floor)) + seg(pen.P(e1.u, e1.v, hb), pen.P(e1.u, e1.v, cav.floor)), "nf lo");
  for (const r of b.holes ?? []) add(pen, poly(at(pen, r, cav.floor)), "nf lo");
  for (const ib of b.inside ?? []) {
    const top = Math.min(hb, ib.z1);
    if (top - ib.z0 < 0.05) continue;
    cylinder(pen, ib.ring, ib.z0, top);
    for (const r of ib.holes ?? []) add(pen, poly(at(pen, r, top)), "nf lo");
  }
  contents?.();
  const fi = run(cav.ring, pen.front), A = at(pen, fo, b.z0), B = at(pen, fi, hb).reverse();
  const o0 = pen.P(fo[0].u, fo[0].v, hb), o1 = pen.P(fo[fo.length - 1].u, fo[fo.length - 1].v, hb);
  add(pen, poly([...A, o1, ...B, o0]), "fo");
  tone(pen, b.ring, b.z0, hb, false);
  add(pen, poly([...at(pen, fo, hb), ...B]), "tt");
  lines();
  add(pen, open(at(pen, fo, hb)) + open(at(pen, fi, hb)), "nf");
  add(pen, open([o0, ...A, o1]), "nf sil");
}

/** The paths a nozzle lays at height z across these blocks, as world polylines. */
export function layerPaths(blocks: Block[], z: number): Vec2[][] {
  const out: Vec2[][] = [];
  for (const b of blocks) {
    if (z <= b.z0 || z > b.z1 + 1e-6) continue;
    out.push(ringXY(b.ring));
    const cav = b.cavity;
    if (cav && z > cav.floor) {
      out.push(ringXY(cav.ring));
      for (const ib of b.inside ?? []) if (z > ib.z0 && z <= ib.z1 + 1e-6) out.push(ringXY(ib.ring));
    } else if (cav) {
      // floor layers: a raster of infill across the cavity, alternating direction per layer
      const us = cav.ring.map((q) => q.u), vs = cav.ring.map((q) => q.v);
      const [u0, u1, v0, v1] = [Math.min(...us) + 2, Math.max(...us) - 2, Math.min(...vs) + 3, Math.max(...vs) - 3];
      const zig: Vec2[] = [], n = Math.max(2, Math.round((v1 - v0) / 8)), flip = Math.round(z * 10) % 2;
      for (let k = 0; k <= n; k++) {
        const v = v0 + ((v1 - v0) * k) / n, row: Vec2[] = [[u0, v], [u1, v]];
        zig.push(...(k % 2 ? row.reverse() : row));
      }
      out.push(flip ? zig.map(([u, v]) => [-u + u0 + u1, v] as Vec2) : zig);
    }
    for (const r of b.holes ?? []) out.push(ringXY(r));
  }
  return out;
}

/** Where the nozzle is after fraction f of a layer, and the trail it has laid. */
export function laid(paths: Vec2[][], f: number): { at: Vec2; trail: Vec2[][] } {
  const lens = paths.map((p) => p.slice(1).reduce((s, q, k) => s + Math.hypot(q[0] - p[k][0], q[1] - p[k][1]), 0));
  let left = lens.reduce((a, b) => a + b, 0) * clamp(f, 0, 1);
  const trail: Vec2[][] = [];
  for (let k = 0; k < paths.length; k++) {
    if (left >= lens[k] && k < paths.length - 1) { trail.push(paths[k]); left -= lens[k]; continue; }
    const part = trace(paths[k], lens[k] ? left / lens[k] : 1);
    trail.push(part);
    return { at: part.length ? part[part.length - 1] : paths[k][0], trail };
  }
  return { at: [0, 0], trail };
}

/* ---------- the printer ---------- */

export const BED: Ring = rrect(-62, -46, 62, 46, 5, 4);

/** The build plate: a thin slab and a sparse grid scored into it. */
export function bed(pen: Pen) {
  prismAt(pen, BED, -4, 0);
  let d = "";
  for (let x = -40; x <= 40; x += 20) d += seg(pen.P(x, -44, 0), pen.P(x, 44, 0));
  for (let y = -30; y <= 30; y += 20) d += seg(pen.P(-60, y, 0), pen.P(60, y, 0));
  add(pen, d, "nf lo");
}

/** The print head at (x, y), its tip at height z, and the gantry rail it rides. */
export function nozzle(pen: Pen, x: number, y: number, z: number) {
  const P = pen.P;
  add(pen, seg(P(-66, y, z + 20), P(66, y, z + 20)) + seg(P(-66, y + 3, z + 20), P(66, y + 3, z + 20)), "nf lo");
  add(pen, seg(P(x, y, z + 16), P(x, y, z + 40)), "nf lo");
  add(pen, poly(hull(at(pen, off(circ(1.1, 12), x, y), z).concat(at(pen, off(circ(4.2, 16), x, y), z + 6)))), "sil");
  prismAt(pen, rrect(x - 6, y - 6, x + 6, y + 6, 2, 3), z + 6, z + 16);
}

/**
 * A part being printed: `pf` is how many layers are laid (fractional: the
 * active one is part-way). Finished layers are solid with their layer lines,
 * the active layer is traced in amber, and the nozzle (`noz` its opacity,
 * `lift` how far it has risen away) sits where the trail ends.
 */
export function printing(pen: Pen, blocks: Block[], pitch: number, pf: number, noz: number, lift: number, contents?: () => void) {
  const layers = Math.round(Math.max(...blocks.map((b) => b.z1)) / pitch);
  const done = Math.min(layers, Math.floor(pf)) * pitch;
  if (done > 0) blocks.forEach((b) => block(pen, b, done, pitch, true, contents));
  if (noz <= 0.01) return;
  const i = clamp(Math.floor(pf), 0, layers - 1), z = (i + 1) * pitch;
  const { at: [nx, ny], trail } = laid(layerPaths(blocks, z - 1e-3), pf >= layers ? 1 : pf - i);
  if (pf > 0 && pf < layers) add(pen, trail.map((p) => open(p.map(([x, y]) => pen.P(x, y, z)))).join(""), "nf amb");
  nozzle(faded(pen, noz), nx, ny, z + 0.4 + lift);
}

/** A part as a mesh file: its outlines plus the triangles of its side faces, all edges showing. Digital, so cyan. */
export function stlWire(pen: Pen, blocks: Block[], f: number) {
  let d = "", tri = "";
  for (const b of blocks) {
    for (const r of [b.ring, ...(b.holes ?? []), ...(b.cavity ? [b.cavity.ring] : [])]) {
      d += open(trace(closed(at(pen, r, b.z1)), f)) + open(trace(closed(at(pen, r, b.z0)), f));
      const n = r.length, step = Math.max(1, Math.round(n / 14));
      for (let i = 0; i < n * f; i += step) {
        const q = r[i], p = r[(i + step) % n];
        tri += seg(pen.P(q.u, q.v, b.z0), pen.P(q.u, q.v, b.z1)) + seg(pen.P(q.u, q.v, b.z0), pen.P(p.u, p.v, b.z1));
      }
    }
  }
  add(pen, tri, "nf cyl");
  add(pen, d, "nf cy");
}

/** Slicing: contour lines rise through the part to height h; the newest is amber. */
export function slice(pen: Pen, blocks: Block[], h: number, pitch: number) {
  let d = "", top = "";
  for (const b of blocks) {
    for (let z = b.z0 + pitch; z <= Math.min(h, b.z1) + 1e-6; z += pitch) {
      const line = poly(at(pen, b.ring, z));
      if (z + pitch > h) top += line; else d += line;
    }
  }
  add(pen, d, "nf lo");
  add(pen, top, "nf amb");
}

/** A dashed outline of the finished part: the target the printer is building toward. */
export function ghost(pen: Pen, blocks: Block[]) {
  let d = "";
  for (const b of blocks) {
    const f = run(b.ring, pen.front), l = f[0], r = f[f.length - 1];
    d += poly(at(pen, b.ring, b.z1)) + open(at(pen, f, b.z0)) + seg(pen.P(l.u, l.v, b.z0), pen.P(l.u, l.v, b.z1)) + seg(pen.P(r.u, r.v, b.z0), pen.P(r.u, r.v, b.z1));
  }
  add(pen, d, "nf dash lo");
}

/** A dimension line (precision, so cyan) between two world points, with end ticks, lifted off the ground by `lift`. */
export function dimension(pen: Pen, a: [number, number, number], b: [number, number, number], f: number, tick: [number, number, number] = [0, 0, 3]) {
  const P = pen.P, m = (k: number): [number, number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const e = m(f), tk = (p: [number, number, number]) => seg(P(p[0] - tick[0], p[1] - tick[1], p[2] - tick[2]), P(p[0] + tick[0], p[1] + tick[1], p[2] + tick[2]));
  add(pen, seg(P(...a), P(...e)) + tk(a) + (f >= 1 ? tk(b) : ""), "nf cy");
}

/** A shipping box: an open tray of card with two long flaps; `close` folds them from open (0) to shut (1). */
export function parcel(pen: Pen, close: number, contents?: () => void, W = 44, D = 26, H = 24) {
  const t = 1.2;
  const box: Block = { ring: rrect(-W, -D, W, D, 1.5, 2), z0: 0, z1: H, cavity: { ring: rrect(-W + t, -D + t, W - t, D - t, 1, 2), floor: t } };
  // a flap hinged on a long top edge (y = ±D), turning from standing outward to lying across the opening
  const flap = (side: 1 | -1) => {
    const a = (1 - close) * 2.05 + 0.02, dy = -side * Math.cos(a) * D, dz = Math.sin(a) * D;
    const pts: Vec2[] = [[-W, side * D, H], [W, side * D, H], [W, side * D + dy, H + dz], [-W, side * D + dy, H + dz]].map(([x, y, z]) => pen.P(x, y, z));
    add(pen, poly(pts), "sil");
  };
  // the far flap stands behind the box while open, and lies on top of it once folded past upright
  if (close < 0.45) flap(-1);
  block(pen, box, H, 99, false, contents);
  if (close >= 0.45) flap(-1);
  flap(1);
}
