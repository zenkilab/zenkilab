/**
 * The "how it works" story, driven by scroll: p runs 0 → 1 across the four
 * steps in src/lib/constants.ts (`steps`), a quarter each.
 *   1  a file and a photo come in; the part appears as a mesh
 *   2  it is sliced and measured for the quote
 *   3  it is printed, one layer per sliver of scroll
 *   4  checked with calipers, packed, and our own products join it
 * `frame(p)` is pure; `caption(p)` is the read-out under the drawing.
 */
import { Cam, EASE_LIFT, facing, fit, hull, lerp, poly, proj, rrect, seg, type Vec3 } from "./hairline";
import { JOBS, jobHeight } from "./jobs";
import {
  add, at, bed, block, dimension, faded, frameTo, ghost, inout, parcel, placed, prismAt, printing, slice, span, stlWire,
  type Item, type Pen, type View,
} from "./parts";
import type { Scene } from "./render";

const JOB = JOBS.bracket, H = jobHeight(JOB), LAYERS = Math.round(H / JOB.pitch);
const STORE = [
  { job: JOBS.keytag, x: -30, y: -22, s: 0.55, t: 0.9 },
  { job: JOBS.dogtag, x: 26, y: -24, s: 0.5, t: 0.93 },
  { job: JOBS.chibi, x: -4, y: 22, s: 0.62, t: 0.96 },
]; // far to near
const BOX: [number, number] = [116, 0];
const S = 1.6, S_CLOSE = 1.95;
const box = (x0: number, x1: number, y0: number, y1: number, z: number): Vec3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
const BED_ONLY: Vec3[] = [...box(-62, 62, -46, 46, -4), ...box(-62, 62, -46, 46, 50)];
const WITH_BOX: Vec3[] = [...box(-62, 162, -46, 46, -4), ...box(-62, 62, -46, 46, 50)];

/** Still frames for each step, for reduced motion and as the server's picture. */
export const STEP_STILLS = [0.2, 0.46, 0.66, 0.99];

/** A document card lying flat: rows of text as lines, one corner folded. */
function card(pen: Pen, z: number) {
  const outline: [number, number][] = [[-17, -22], [9, -22], [17, -14], [17, 22], [-17, 22]];
  const top = outline.map(([x, y]) => pen.P(x, y, z + 1.5)), base = outline.map(([x, y]) => pen.P(x, y, z));
  add(pen, poly(hull(top.concat(base))), "sil");
  add(pen, poly(top) + poly([pen.P(9, -22, z + 1.5), pen.P(9, -14, z + 1.5), pen.P(17, -14, z + 1.5)]), "nf");
  let rows = "";
  for (let y = -10; y <= 14; y += 6) rows += seg(pen.P(-12, y, z + 1.5), pen.P(y < 10 ? 11 : 0, y, z + 1.5));
  add(pen, rows, "nf lo");
}

/** A phone lying flat with a photo of the part on its screen. */
function phone(pen: Pen, z: number) {
  prismAt(pen, rrect(-12, -23, 12, 23, 4, 4), z, z + 3);
  add(pen, poly(at(pen, rrect(-10, -19, 10, 19, 2, 3), z + 3)), "nf");
  const shot = placed(pen, 0, 0, z + 3, 0.2);
  add(shot, poly(at(shot, JOB.blocks[0].ring, 0)) + poly(at(shot, JOB.blocks[1].ring, 20)), "nf lo");
}

/** Calipers on the bed in front of the part: a beam, a fixed jaw at its left end, a sliding jaw closing to x. */
function calipers(pen: Pen, x: number) {
  prismAt(pen, rrect(-58, 22, 60, 27, 1, 2), 0, 2.4);
  prismAt(pen, rrect(-42.5, 15, -39.5, 27, 1, 2), 0, 2.4);
  prismAt(pen, rrect(x - 1.5, 15, x + 1.5, 29, 1, 2), 0, 2.8);
}

export function frame(p: number, view: View = { az: 0, k: 0, lift: 0 }): Item[] {
  p = Math.min(1, Math.max(0, p));
  const out: Item[] = [];
  // frame the bed close, then pull back and pan right as the parcel arrives in step 4
  const pan = inout(span(p, 0.78, 0.88));
  const C = Cam(45 + view.az, 0.5 + view.k, S);
  frameTo(C, BED_ONLY, S_CLOSE, 300, 200, 166);
  const close = C.S;
  frameTo(C, WITH_BOX, S, 370, 200, 166);
  C.S = lerp(close, C.S, pan);
  fit(C, BED_ONLY, 200, 166);
  const [bx, by] = [C.ox, C.oy];
  fit(C, WITH_BOX, 200, 166);
  C.ox = lerp(bx, C.ox, pan); C.oy = lerp(by, C.oy, pan) + view.lift;
  const pen: Pen = { P: proj(C), front: facing(C), o: 1, out };

  bed(pen);

  // 1. a file and a photo arrive above the bed; the part forms beneath them as a mesh
  const arrive = EASE_LIFT(span(p, 0, 0.08)), sink = inout(span(p, 0.08, 0.2));
  const wire = span(p, 0.08, 0.2) * (1 - span(p, 0.47, 0.53)); // the mesh stays through the quote, until printing starts
  if (wire > 0.01) stlWire(faded(pen, wire), JOB.blocks, span(p, 0.08, 0.2));
  // 2. sliced, then measured
  if (p >= 0.25 && p < 0.42) slice(faded(pen, 1 - span(p, 0.38, 0.42)), JOB.blocks, H * inout(span(p, 0.25, 0.38)), JOB.pitch);
  const target = span(p, 0.36, 0.42) * (1 - span(p, 0.72, 0.76));
  if (target > 0.01) ghost(faded(pen, target), JOB.blocks);
  // 3. printed: scroll lays the layers
  const pf = span(p, 0.52, 0.73) * LAYERS;
  const noz = span(p, 0.48, 0.52) * (1 - span(p, 0.74, 0.77));
  const lift = 30 * (1 - EASE_LIFT(span(p, 0.48, 0.52))) + 30 * inout(span(p, 0.73, 0.77));
  const inBox = inout(span(p, 0.86, 0.92));
  if (p < 0.86) printing(pen, JOB.blocks, JOB.pitch, p >= 0.73 ? LAYERS : pf, noz, lift);
  // 2 (cont.). the quote's measurements: footprint and height
  const dims = span(p, 0.4, 0.47) * (1 - span(p, 0.5, 0.54));
  if (dims > 0.01) {
    const d = faded(pen, dims), f = span(p, 0.4, 0.47);
    dimension(d, [-40, 26, 0], [40, 26, 0], f, [0, 2.5, 0]);
    dimension(d, [46, -12, 0], [46, -12, H], f, [2.5, 0, 0]);
  }
  // 4. calipers check it, it is packed, and our products land where it stood
  const cal = span(p, 0.75, 0.78) * (1 - span(p, 0.83, 0.86));
  if (cal > 0.01) calipers(faded(pen, cal), lerp(58, 41.5, inout(span(p, 0.76, 0.82))));
  const boxIn = inout(span(p, 0.8, 0.86));
  if (boxIn > 0.01) {
    const bp = faded(placed(pen, lerp(BOX[0] + 60, BOX[0], boxIn), BOX[1], 0), boxIn);
    parcel(bp, inout(span(p, 0.92, 0.97)), inBox >= 1 ? () => JOB.blocks.forEach((b) => block(placed(bp, 0, 0, 1.2), b, H, JOB.pitch, true)) : undefined, 46, 22, 38);
  }
  if (p >= 0.86 && inBox < 1) {
    const mv = placed(pen, lerp(0, BOX[0], inBox), lerp(0, BOX[1], inBox), 1.2 * inBox + 46 * Math.sin(Math.PI * inBox));
    JOB.blocks.forEach((b) => block(mv, b, H, JOB.pitch, true));
  }
  for (const it of STORE) {
    const f = EASE_LIFT(span(p, it.t, it.t + 0.04));
    if (f > 0.01) it.job.blocks.forEach((b) => block(faded(placed(pen, it.x, it.y, 18 * (1 - f), it.s), f), b, jobHeight(it.job), it.job.pitch, true));
  }
  // 1 (cont.). the file card and the phone, drawn last: they float above everything
  const show = arrive * (1 - span(p, 0.16, 0.22));
  if (show > 0.01) {
    const z = lerp(70, 50, arrive) - 30 * sink;
    card(faded(placed(pen, -26, -8, 0), show), z);
    phone(faded(placed(pen, 30, 10, 0), show * (1 - span(p, 0.12, 0.18))), z - 4);
  }
  return out;
}

export function caption(p: number): string {
  if (p < 0.08) return "INCOMING · STL FILE + PHOTO";
  if (p < 0.25) return "FILE RECEIVED · BRACKET.STL";
  if (p < 0.4) return `SLICING · ${JOB.realLayers} LAYERS · 0.2 MM`;
  if (p < 0.5) return `QUOTE · 80 × 32 × 34 MM · ${JOB.material}`;
  if (p < 0.75) return `PRINTING · ${JOB.material} · L ${Math.max(1, Math.ceil(span(p, 0.52, 0.73) * JOB.realLayers))}/${JOB.realLayers}`;
  if (p < 0.86) return "QUALITY CHECK · 80.0 MM";
  if (p < 0.9) return "PACKED FOR DELIVERY";
  return "PACKED · PLUS OUR OWN PRODUCTS";
}

export const STORY_SCENE: Scene = { frame, caption, still: 0.2, freeze: "story-p" };
