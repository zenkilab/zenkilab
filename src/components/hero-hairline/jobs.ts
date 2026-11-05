/**
 * What the workshop prints: customers' files and Zenki Lab's own products,
 * each as a few rounded blocks (see Block in parts.ts). Adding a product is
 * one entry here. Units are drawing units, roughly millimetres scaled to read
 * at hero size; heights of thin parts are exaggerated so their layers show.
 */
import { circ, lerp, poly, rrect } from "./hairline";
import { add, at, cylinder, off, type Block, type Pen } from "./parts";

export type Job = {
  id: string;
  kind: "customer" | "store";
  name: string; // for the read-out, never drawn
  material: string;
  realLayers: number; // at 0.2 mm, for the read-out
  pitch: number; // drawn layer height
  blocks: Block[];
  gears?: boolean;
};

export const jobHeight = (j: Job) => Math.max(...j.blocks.map((b) => b.z1));
/** How much a job shrinks to sit in a shelf slot. */
export const shelfScale = (j: Job) => {
  const xs = j.blocks.flatMap((b) => b.ring.map((q) => q.u)), ys = j.blocks.flatMap((b) => b.ring.map((q) => q.v));
  return Math.min(1, 34 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)), 24 / jobHeight(j));
};

/* ---------- the gearbox: an open housing, then two meshing gears on shafts ---------- */

export const M = 2.5; // module
export const N1 = 12, N2 = 18; // 2:3, so the big gear turns at 2/3 the speed of the small one
const R1 = (M * N1) / 2, R2 = (M * N2) / 2; // pitch radii 15, 22.5
export const X1 = -23, X2 = X1 + R1 + R2; // centre distance = R1 + R2
const FLOOR = 4, BOSS_Z = 8, SHAFT_R = 2.2, SHAFT_TOP = 24, GZ0 = 12, GT = 5, HUB_R = 5.5, HUB_H = 2;
const CENTRES = [X1, X2];
const SHAFT = circ(SHAFT_R, 16), HUB = circ(HUB_R, 24), MARK = circ(1.3, 10);

/** One gear's outline as [angle, radius] vertices: a trapezoid tooth with backlash, ~ involute in silhouette. */
export function profile(N: number): [number, number][] {
  const r = (M * N) / 2, rr = r - 1.25 * M, ra = r + M, p = (2 * Math.PI) / N, out: [number, number][] = [];
  for (let k = 0; k < N; k++) {
    const c = k * p;
    out.push([c - 0.29 * p, rr], [c - 0.225 * p, r], [c - 0.12 * p, ra], [c + 0.12 * p, ra], [c + 0.225 * p, r], [c + 0.29 * p, rr], [c + 0.5 * p, rr - 0.15]);
  }
  return out;
}
const PROF = [profile(N1), profile(N2)];

/** Opposite directions, speeds in the inverse ratio of tooth counts; gear 2 starts with a gap facing gear 1's tooth. */
export const angles = (th1: number): [number, number] => [th1, Math.PI - Math.PI / N2 - (N1 / N2) * th1];
export const gearXY = (prof: [number, number][], cx: number, th: number): [number, number][] =>
  prof.map(([a, r]) => [cx + r * Math.cos(a + th), r * Math.sin(a + th)]);
export const PROFILES = PROF;

/**
 * The two gears on their shafts, lowered `lift` above their seats, turned to
 * θ (small gear). `marks` fades in the amber timing marks. Painted inside the
 * housing, before its near wall.
 */
export function gears(pen: Pen, lift: number, th: number, marks: number) {
  const th2 = angles(th)[1], g1 = GZ0 + GT + lift, g0 = g1 - GT, hubTop = g1 + HUB_H;
  CENTRES.forEach((cx, i) => {
    const s0 = Math.max(FLOOR + lift, BOSS_Z), s1 = SHAFT_TOP + lift, sh = off(SHAFT, cx, 0);
    if (Math.min(s1, g0) > s0) cylinder(pen, sh, s0, Math.min(s1, g0));
    // the gear: two outlines and the fills between them make its thickness
    const xy = gearXY(PROF[i], cx, i ? th2 : th);
    const ring = (z: number) => xy.map(([x, y]) => pen.P(x, y, z));
    add(pen, poly(ring(g0)), "lo");
    for (let j = 1; j < 4; j++) add(pen, poly(ring(lerp(g0, g1, j / 4))), "fo");
    add(pen, poly(ring(g1)), "sil");
    add(pen, poly(circ((i ? R2 : R1) - 2.2 * M, 40).map((q) => pen.P(q.u + cx, q.v, g1))), "nf lo");
    cylinder(pen, off(HUB, cx, 0), g1, hubTop);
    if (marks > 0.01) {
      const r = (i ? R2 : R1) - 1.9 * M, a = i ? th2 + Math.PI / N2 : th;
      add(pen, poly(at(pen, off(MARK, cx + r * Math.cos(a), r * Math.sin(a)), g1)), "ambdot", marks);
    }
    if (s1 > hubTop) cylinder(pen, sh, Math.max(s0, hubTop), s1);
  });
}

const boss = (cx: number): Block => ({ ring: off(circ(5.5, 24), cx, 0), z0: FLOOR, z1: BOSS_Z, holes: [off(circ(SHAFT_R + 0.4, 16), cx, 0)] });

/* ---------- the list ---------- */

export const JOBS: Record<string, Job> = {
  gearbox: {
    id: "gearbox", kind: "customer", name: "Gearbox housing", material: "PETG", realLayers: 80, pitch: 2, gears: true,
    blocks: [{
      ring: rrect(-50, -35, 50, 35, 7, 6), z0: 0, z1: 16,
      cavity: { ring: rrect(-45, -30, 45, 30, 3, 5), floor: FLOOR },
      inside: CENTRES.map(boss),
    }],
  },
  bracket: {
    id: "bracket", kind: "customer", name: "Bracket", material: "PETG", realLayers: 170, pitch: 3.4,
    blocks: [
      { ring: rrect(-40, -16, 40, 16, 3, 4), z0: 0, z1: 6, holes: [off(circ(4, 18), -26, 4), off(circ(4, 18), 26, 4)] },
      { ring: rrect(-40, -16, 40, -9, 2, 3), z0: 6, z1: 34 },
    ],
  },
  keytag: {
    id: "keytag", kind: "store", name: "Key tag", material: "PETG", realLayers: 13, pitch: 1.25,
    blocks: [{
      ring: rrect(-40, -20, 40, 20, 20, 8), z0: 0, z1: 5,
      cavity: { ring: rrect(-36.3, -16.3, 36.3, 16.3, 16.3, 8), floor: 2.5 },
      holes: [off(circ(3.6, 16), -26, 0)],
      inside: [{ ring: off(circ(7, 24), -26, 0), z0: 2.5, z1: 5, holes: [off(circ(3.6, 16), -26, 0)] }],
    }],
  },
  dogtag: {
    id: "dogtag", kind: "store", name: "Dog tag", material: "PETG", realLayers: 40, pitch: 2,
    blocks: [
      { ring: rrect(-43, -16, 43, 16, 6, 4), z0: 0, z1: 3 },
      { ring: rrect(-31, -16, -21, 16, 2, 3), z0: 3, z1: 8 }, // belt loops: printed back up
      { ring: rrect(21, -16, 31, 16, 2, 3), z0: 3, z1: 8 },
    ],
  },
  chibi: {
    id: "chibi", kind: "store", name: "Chibi figure", material: "PLA", realLayers: 210, pitch: 3.5,
    blocks: [
      { ring: circ(15, 36), z0: 0, z1: 4 },
      { ring: rrect(-10, -8, 10, 8, 7, 4), z0: 4, z1: 21 },
      // a big head, rounded top and bottom by narrower slices
      { ring: circ(10.5, 36), z0: 21, z1: 24 },
      { ring: circ(14, 36), z0: 24, z1: 38 },
      { ring: circ(10.5, 36), z0: 38, z1: 42 },
    ],
  },
};
