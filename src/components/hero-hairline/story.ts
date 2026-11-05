/**
 * "From idea to finished part", driven by scroll: p runs 0 → 1 across the
 * four steps in src/lib/constants.ts (`steps`), a quarter each. Values down
 * to -0.1 are the hand-off from the hero: the request starts arriving while
 * the print queue leaves.
 *   1  three ways in (a 3D file, a photo of the part, a note) land and are gathered into one request
 *   2  the file is checked under a loupe and measured; an itemised quote builds,
 *      a material is recommended, the 24 h clock runs, and the quote is approved
 *   3  only now the printer: the part moves onto the bed and is printed
 *   4  checked with calipers, packed, and our own products join it
 * `frame(p)` is pure; `caption(p)` is the read-out under the drawing.
 */
import { Cam, EASE_LIFT, circ, facing, fit, hull, lerp, open, poly, proj, rrect, seg, type Vec2, type Vec3 } from "./hairline";
import { JOBS, jobHeight } from "./jobs";
import {
  add, at, bed, block, dimension, faded, frameTo, ghost, inout, off, parcel, placed, prismAt, printing, slice, span, stlWire, trace,
  type Item, type Pen, type View,
} from "./parts";

const JOB = JOBS.bracket, H = jobHeight(JOB), LAYERS = Math.round(H / JOB.pitch);
const STORE = [
  { job: JOBS.keytag, x: -30, y: -22, s: 0.55, t: 0.9 },
  { job: JOBS.dogtag, x: 26, y: -24, s: 0.5, t: 0.93 },
  { job: JOBS.chibi, x: -4, y: 22, s: 0.62, t: 0.96 },
]; // far to near
const BOX: [number, number] = [116, 0];
const MESH: [number, number] = [-38, 4], MESH_S = 0.8; // where the file is reviewed
const QUOTE: [number, number] = [36, -8], QUOTE_S = 1.15;
const S = 1.6, S_CLOSE = 1.95;
const box = (x0: number, x1: number, y0: number, y1: number, z: number): Vec3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
const DESK: Vec3[] = [...box(-66, 66, -54, 54, -4), ...box(-62, 62, -46, 46, 50)];
const WITH_BOX: Vec3[] = [...box(-62, 162, -46, 46, -4), ...box(-62, 62, -46, 46, 50)];

export const P_MIN = -0.1;
/** Still frames for each step, for reduced motion and without JavaScript. */
export const STEP_STILLS = [0.1, 0.44, 0.66, 0.99];

/* ---------- step 1: the ways a request comes in ---------- */

/** A flat sheet of paper or card, `T` thick, its outline given as a polygon. */
function sheet(pen: Pen, outline: Vec2[], z: number, cls: string, T = 1.2) {
  const top = outline.map(([x, y]) => pen.P(x, y, z + T)), base = outline.map(([x, y]) => pen.P(x, y, z));
  add(pen, poly(hull(top.concat(base))), cls);
  add(pen, poly(top), "nf");
}
/** Lines of text on a flat surface at height z: [y, x0, x1] each. */
function rows(pen: Pen, lines: [number, number, number][], z: number, cls = "nf lo") {
  add(pen, lines.map(([y, a, b]) => seg(pen.P(a, y, z), pen.P(b, y, z))).join(""), cls);
}

/** The 3D file: a card with a folded corner and the part's mesh on it. */
function fileCard(pen: Pen, z: number, hi: boolean) {
  sheet(pen, [[-17, -22], [9, -22], [17, -14], [17, 22], [-17, 22]], z, hi ? "hi" : "sil");
  add(pen, poly([pen.P(9, -22, z + 1.2), pen.P(9, -14, z + 1.2), pen.P(17, -14, z + 1.2)]), "nf");
  stlWire(placed(pen, 0, -2, z + 1.2, 0.22), JOB.blocks, 1);
  rows(pen, [[15, -12, 8], [19, -12, 2]], z + 1.2);
}
/** A photo of the part, on a phone. */
function photo(pen: Pen, z: number, hi: boolean) {
  prismAt(pen, rrect(-12, -23, 12, 23, 4, 4), z, z + 3, hi ? "hi" : "sil");
  add(pen, poly(at(pen, rrect(-10, -19, 10, 19, 2, 3), z + 3)), "nf");
  const shot = placed(pen, 0, 0, z + 3, 0.2);
  add(shot, poly(at(shot, JOB.blocks[0].ring, 0)) + poly(at(shot, JOB.blocks[1].ring, 24)), "nf lo");
  // the reason for the photo: a crack across the old part
  add(pen, open(([[-6, -8], [-2, -4], [-4, 0], [1, 4], [-1, 8]] as Vec2[]).map(([x, y]) => pen.P(x, y, z + 3))), "nf");
}
/** A note: a message bubble with a few lines and a rough sketch. */
function note(pen: Pen, z: number, hi: boolean) {
  sheet(pen, [[-20, -16], [20, -16], [20, 12], [-6, 12], [-12, 20], [-11, 12], [-20, 12]], z, hi ? "hi" : "sil");
  rows(pen, [[-10, -15, 14], [-5, -15, 9], [0, -15, 12]], z + 1.2);
  add(pen, open(([[-14, 8], [-14, 5], [-4, 5], [-4, 2]] as Vec2[]).map(([x, y]) => pen.P(x, y, z + 1.2))), "nf");
}
const WAYS = [
  { draw: fileCard, at: [-36, 30] as Vec2, hi: [0.0, 0.08] },
  { draw: photo, at: [0, 0] as Vec2, hi: [0.08, 0.14] },
  { draw: note, at: [36, -30] as Vec2, hi: [0.14, 0.19] },
]; // one row across the screen (equal x + y), left to right
const WAY_S = 1.3;

/** The request folder they are gathered into. */
function folder(pen: Pen) {
  sheet(pen, [[-30, -26], [-30, -32], [-12, -32], [-8, -26], [30, -26], [30, 26], [-30, 26]], 0, "sil", 1);
}

/* ---------- step 2: review and quote ---------- */

/** A loupe lying flat at height z, lens centred on (x, y). */
function loupe(pen: Pen, x: number, y: number, z: number) {
  prismAt(pen, rrect(x - 1.8, y + 12, x + 1.8, y + 30, 1.5, 2), z, z + 2);
  // glass: the rim's outline only, so the part shows through
  const lens = off(circ(12, 36), x, y);
  add(pen, poly(hull(at(pen, lens, z + 2.5).concat(at(pen, lens, z)))), "nf sil");
  add(pen, poly(at(pen, off(circ(10, 36), x, y), z + 2.5)), "nf lo");
}

/** The quote: a sheet whose rows fill in, material options with one recommended, a total, and the approval tick. */
function quote(pen: Pen, p: number) {
  sheet(pen, [[-22, -32], [22, -32], [22, 32], [-22, 32]], 0, "sil");
  const z = 1.2, f = (a: number) => span(p, a, a + 0.02);
  // material options; the recommended one turns amber
  [-15, -7, 1].forEach((x, i) => add(pen, poly(at(pen, off(circ(2.6, 14), x, -25), z)), i === 1 && p > 0.38 ? "nf amb" : "nf"));
  // itemised rows, then a rule and the total
  let d = "";
  for (let i = 0; i < 5; i++) {
    const y = -16 + i * 6, k = f(0.33 + i * 0.012);
    if (k > 0) d += seg(pen.P(-17, y, z), pen.P(lerp(-17, [6, 0, 4, -3, 2][i], k), y, z)) + seg(pen.P(11, y, z), pen.P(lerp(11, 17, k), y, z));
  }
  if (f(0.4) > 0) d += seg(pen.P(-17, 15, z), pen.P(lerp(-17, 17, f(0.4)), 15, z));
  add(pen, d, "nf");
  if (f(0.42) > 0) add(pen, seg(pen.P(-17, 21, z), pen.P(-2, 21, z)) + seg(pen.P(7, 21, z), pen.P(lerp(7, 17, f(0.42)), 21, z)), "nf sil");
  // approved
  const tick = trace(([[-15, 26], [-11, 29], [-3, 22]] as Vec2[]).map(([x, y]) => pen.P(x, y, z)), span(p, 0.45, 0.48));
  add(pen, open(tick), "nf amb");
}

/** The turnaround clock: a dial lying flat, its hand sweeping as the day's review runs. */
function clock(pen: Pen, x: number, y: number, a: number) {
  const dial = off(circ(7, 32), x, y);
  add(pen, poly(hull(at(pen, dial, 1.5).concat(at(pen, dial, 0)))), "sil");
  add(pen, poly(at(pen, off(circ(5.5, 32), x, y), 1.5)), "nf lo");
  add(pen, seg(pen.P(x, y, 1.5), pen.P(x + 5 * Math.sin(a), y - 5 * Math.cos(a), 1.5)) + seg(pen.P(x, y - 5.5, 1.5), pen.P(x, y - 4, 1.5)), "nf");
}

/** Calipers on the bed in front of the part: a beam, a fixed jaw at its left end, a sliding jaw closing to x. */
function calipers(pen: Pen, x: number) {
  prismAt(pen, rrect(-58, 22, 60, 27, 1, 2), 0, 2.4);
  prismAt(pen, rrect(-42.5, 15, -39.5, 27, 1, 2), 0, 2.4);
  prismAt(pen, rrect(x - 1.5, 15, x + 1.5, 29, 1, 2), 0, 2.8);
}

export function frame(p: number, view: View = { az: 0, k: 0, lift: 0, dx: 0 }): Item[] {
  p = Math.min(1, Math.max(P_MIN, p));
  const out: Item[] = [];
  // frame the desk close, then pull back and pan right as the parcel arrives in step 4
  const pan = inout(span(p, 0.78, 0.88));
  const C = Cam(45 + view.az, 0.5 + view.k, S);
  frameTo(C, DESK, S_CLOSE, 310, 200, 166);
  const close = C.S;
  frameTo(C, WITH_BOX, S, 370, 200, 166);
  C.S = lerp(close, C.S, pan);
  fit(C, DESK, 200, 166);
  const [bx, by] = [C.ox, C.oy];
  fit(C, WITH_BOX, 200, 166);
  C.ox = lerp(bx, C.ox, pan) + view.dx; C.oy = lerp(by, C.oy, pan) + view.lift;
  const pen: Pen = { P: proj(C), front: facing(C), o: 1, out };

  /* 3–4: the printer's bed rises in only when production starts */
  const bedIn = span(p, 0.48, 0.54);
  if (bedIn > 0.01) bed(faded(placed(pen, 0, 0, -10 * (1 - EASE_LIFT(bedIn))), bedIn));

  /* 1. the request: three ways in, each lit in turn, then gathered into one folder */
  const gather = inout(span(p, 0.19, 0.25)), leave = span(p, 0.25, 0.3);
  if (leave < 1) {
    const fp = faded(placed(pen, lerp(0, -40, leave), 0, 0, lerp(1, 0.7, leave)), 1 - leave);
    if (gather > 0.01) folder(faded(fp, gather));
    WAYS.forEach((w, i) => {
      const a = EASE_LIFT(span(p, P_MIN + 0.025 * i, P_MIN + 0.06 + 0.025 * i));
      if (a < 0.01) return;
      const x = lerp(w.at[0] - 24 * (1 - a), 0, gather), y = lerp(w.at[1] + 24 * (1 - a), 0, gather); // in from the left
      const z = 34 * (1 - a) + gather * (2 + i * 3.5);
      const sc = lerp(WAY_S, 0.95, gather);
      w.draw(faded(placed(fp, x, y, 0, sc), a), z / sc, p >= w.hi[0] && p < w.hi[1]);
    });
  }

  /* 2. review: the file as a mesh under a loupe, measured; then 3: it moves onto the bed */
  const toBed = inout(span(p, 0.52, 0.57));
  const mx = lerp(MESH[0], 0, toBed), my = lerp(MESH[1], 0, toBed), ms = lerp(MESH_S, 1, toBed);
  const wire = span(p, 0.27, 0.33) * (1 - span(p, 0.58, 0.62));
  if (wire > 0.01) stlWire(faded(placed(pen, mx, my, 0, ms), wire), JOB.blocks, span(p, 0.27, 0.33));
  const dims = span(p, 0.36, 0.41) * (1 - span(p, 0.48, 0.52));
  if (dims > 0.01) {
    const d = faded(placed(pen, mx, my, 0, ms), dims), f = span(p, 0.36, 0.41);
    dimension(d, [-40, 26, 0], [40, 26, 0], f, [0, 2.5, 0]);
    dimension(d, [46, -12, 0], [46, -12, H], f, [2.5, 0, 0]);
  }

  /* the quote and its clock, sliding away when production starts */
  const qIn = EASE_LIFT(span(p, 0.29, 0.33)), qOut = inout(span(p, 0.5, 0.55));
  if (qIn > 0.01 && qOut < 0.99) {
    const qp = faded(placed(pen, QUOTE[0] + 40 * qOut, QUOTE[1], 20 * (1 - qIn), QUOTE_S), qIn * (1 - qOut));
    quote(qp, p);
    clock(qp, 34, 20, 2 * Math.PI * 0.85 * inout(span(p, 0.33, 0.46)));
  }

  /* 3. sliced on the bed, then printed: scroll lays the layers */
  if (p >= 0.56 && p < 0.62) slice(faded(pen, 1 - span(p, 0.6, 0.62)), JOB.blocks, H * inout(span(p, 0.56, 0.6)), JOB.pitch);
  const target = span(p, 0.59, 0.62) * (1 - span(p, 0.72, 0.76));
  if (target > 0.01) ghost(faded(pen, target), JOB.blocks);
  const pf = span(p, 0.61, 0.73) * LAYERS;
  const noz = span(p, 0.58, 0.61) * (1 - span(p, 0.74, 0.77));
  const lift = 30 * (1 - EASE_LIFT(span(p, 0.58, 0.61))) + 30 * inout(span(p, 0.73, 0.77));
  const inBox = inout(span(p, 0.86, 0.92));
  if (p >= 0.58 && p < 0.86) printing(pen, JOB.blocks, JOB.pitch, p >= 0.73 ? LAYERS : pf, noz, lift);

  /* 4. calipers check it, it is packed, and our products land where it stood */
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

  /* the loupe passes over the file, above everything */
  const lo = span(p, 0.29, 0.31) * (1 - span(p, 0.42, 0.45));
  if (lo > 0.01) loupe(faded(pen, lo), lerp(MESH[0] - 30, MESH[0] + 28, inout(span(p, 0.3, 0.42))), MESH[1] - 4, 34);
  return out;
}

export function caption(p: number): string {
  if (p < 0) return "NEW REQUEST";
  if (p < 0.08) return "REQUEST · YOUR 3D FILE";
  if (p < 0.14) return "REQUEST · A PHOTO OF THE PART";
  if (p < 0.19) return "REQUEST · A NOTE ON WHAT YOU NEED";
  if (p < 0.25) return "REQUEST · RECEIVED";
  if (p < 0.36) return "REVIEW · CHECKING THE FILE";
  if (p < 0.42) return `REVIEW · 80 × 32 × 34 MM · ${JOB.material} RECOMMENDED`;
  if (p < 0.5) return "QUOTE · ITEMISED · WITHIN 24 H";
  if (p < 0.61) return `IN PRODUCTION · SLICING ${JOB.realLayers} LAYERS`;
  if (p < 0.75) return `PRINTING · ${JOB.material} · L ${Math.max(1, Math.ceil(span(p, 0.61, 0.73) * JOB.realLayers))}/${JOB.realLayers}`;
  if (p < 0.86) return "QUALITY CHECK · 80.0 MM";
  if (p < 0.9) return "PACKED FOR DELIVERY";
  return "PACKED · PLUS OUR OWN PRODUCTS";
}

