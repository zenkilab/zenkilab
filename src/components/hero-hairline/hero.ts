/**
 * The hero: a print queue. Each job arrives as a mesh file, is sliced,
 * printed layer by layer, and moves to the finished-parts tray; customer files
 * and store products alternate. The gearbox gets its gears fitted and turning.
 * `frame(t)` is pure; `caption(t)` is the read-out shown under the drawing.
 */
import { Cam, EASE_LIFT, facing, lerp, proj, rrect, type Vec3 } from "./hairline";
import { JOBS, gears, jobHeight, shelfScale, type Job } from "./jobs";
import {
  bed, light, block, faded, frameTo, ghost, inout, placed, printing, slice, span, stlWire,
  type Block, type Item, type Pen, type View,
} from "./parts";

const QUEUE: Job[] = [JOBS.gearbox, JOBS.keytag, JOBS.bracket, JOBS.chibi];
const PRINT = 2.3, GEAR_EXTRA = 2.2, LEAVE = 0.9;

type Seg = { job: Job; t0: number; printEnd: number; leave: number; end: number };
const SEGS: Seg[] = [];
{
  let t = 0;
  for (const job of QUEUE) {
    const printEnd = t + 1.8 + PRINT, leave = printEnd + 0.3 + (job.gears ? GEAR_EXTRA : 0);
    SEGS.push({ job, t0: t, printEnd, leave, end: leave + LEAVE });
    t = leave + LEAVE + 0.15;
  }
}
export const CYCLE = SEGS[SEGS.length - 1].end + 1.1;
export const STATIC_T = SEGS[3].t0 + 1.8 + PRINT * 0.62; // three parts done, the figure two-thirds printed
const W1 = 0.6; // rad/s of the small gear, once fitted

/* the finished-parts tray, beside the bed */
const TRAY: Block = { ring: rrect(70, -44, 154, 44, 5, 4), z0: 0, z1: 4, cavity: { ring: rrect(73, -41, 151, 41, 3, 4), floor: 1.5 } };
const SLOTS: [number, number][] = [[92, -20], [132, -20], [92, 20], [132, 20]]; // far to near
const S = 1.62;
const box = (x0: number, x1: number, y0: number, y1: number, z: number): Vec3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
const FRAME: Vec3[] = [...box(-62, 154, -46, 46, -4), ...box(-62, 62, -46, 46, 34)];

/** The hero's camera at rest (no drift, no tilt). The back and front planes (workshop.ts) are drawn once with it. */
export function restCam() {
  const C = Cam(45, 0.5, S);
  frameTo(C, FRAME, S, 352, 200, 168);
  return C;
}

/** Gear angle for a job finished at `fitted` (seconds), ramping up over 0.8 s. */
const turn = (t: number, fitted: number) => {
  const tau = t - fitted, ramp = 0.8;
  if (tau <= 0) return 0;
  return tau < ramp ? (W1 * tau * tau) / (2 * ramp) : W1 * (tau - ramp / 2);
};

/** A finished job at rest: printed in full, with its gears in and turning if it has any. */
function finished(pen: Pen, s: Seg, t: number) {
  const H = jobHeight(s.job), fitted = s.printEnd + 1.3;
  s.job.blocks.forEach((b) => block(pen, b, H, s.job.pitch, true, s.job.gears ? () => gears(pen, 0, turn(t, fitted), 1) : undefined));
}

export function frame(t: number, view: View = { az: 0, k: 0, lift: 0, dx: 0 }): Item[] {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const out: Item[] = [];
  const C = Cam(45 + 6 * Math.sin((2 * Math.PI * t) / CYCLE) + view.az, 0.5 + view.k, S);
  frameTo(C, FRAME, S, 352, 200, 168);
  C.oy += view.lift; C.ox += view.dx;
  const pen: Pen = { P: proj(C), front: facing(C), lit: light(C), o: 1, out };

  bed(pen);

  const k = SEGS.findIndex((s) => t >= s.t0 && t < s.end + 0.15);
  const cur = k >= 0 ? SEGS[k] : null;

  /* the job on the bed */
  if (cur && t < cur.leave) {
    const { job } = cur, H = jobHeight(job), lt = t - cur.t0;
    // 1. the file arrives: a mesh, settling onto the bed
    const wire = span(lt, 0, 0.9) * (1 - span(lt, 1.3, 1.9));
    if (wire > 0.01) stlWire(faded(placed(pen, 0, 0, 10 * (1 - EASE_LIFT(span(lt, 0, 0.9)))), wire), job.blocks, span(lt, 0, 0.9));
    // 2. sliced into layers, then held as a dashed target
    if (lt >= 0.9 && lt < 1.9) slice(faded(pen, 1 - span(lt, 1.6, 1.9)), job.blocks, H * inout(span(lt, 0.9, 1.6)), job.pitch);
    if (lt >= 1.6 && t < cur.printEnd + 0.3) ghost(faded(pen, span(lt, 1.6, 1.9) * (1 - span(t, cur.printEnd, cur.printEnd + 0.3))), job.blocks);
    // 3. printed layer by layer, the active layer in amber; 4. gears fitted, if any
    const pf = span(t, cur.t0 + 1.8, cur.printEnd) * Math.round(H / job.pitch);
    const noz = span(lt, 1.5, 1.8) * (1 - span(t, cur.printEnd + 0.1, cur.printEnd + 0.4));
    const lift = 30 * (1 - EASE_LIFT(span(lt, 1.5, 1.8))) + 30 * inout(span(t, cur.printEnd, cur.printEnd + 0.4));
    const seated = cur.printEnd + 1.3;
    printing(pen, job.blocks, job.pitch, pf, noz, lift, job.gears && t > cur.printEnd
      ? () => gears(faded(pen, span(t, cur.printEnd, cur.printEnd + 0.3)), 34 * (1 - inout(span(t, cur.printEnd + 0.2, seated))), turn(t, seated), span(t, seated, seated + 0.5))
      : undefined);
  }

  /* the tray and what has finished this lap */
  const clear = 1 - span(t, CYCLE - 1.0, CYCLE - 0.2);
  const doneSegs = SEGS.map((s, i) => ({ s, i })).filter(({ s }) => t >= s.end);
  block(pen, TRAY, 4, 99, false, () => {
    for (const { s, i } of doneSegs) finished(faded(placed(pen, ...SLOTS[i], 1.5, shelfScale(s.job)), clear), s, t);
  });

  /* the part travelling from the bed to its slot */
  if (cur && t >= cur.leave && t < cur.end) {
    const f = inout(span(t, cur.leave, cur.end)), [sx, sy] = SLOTS[k];
    finished(placed(pen, lerp(0, sx, f), lerp(0, sy, f), 1.5 * f + 26 * Math.sin(Math.PI * f), lerp(1, shelfScale(cur.job), f)), cur, t);
  }
  return out;
}

const pad = (n: number) => String(n).padStart(3, "0");

/** The read-out: which job, whose, and what is happening to it. */
export function caption(t: number): string {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const k = SEGS.findIndex((s) => t >= s.t0 && t < s.end + 0.15);
  if (k < 0) return "QUEUE · NEXT JOB";
  const s = SEGS[k], j = s.job, lt = t - s.t0;
  const head = `JOB ${pad(14 + k)} · ${j.kind === "store" ? "ZENKI STORE" : "CUSTOMER STL"} · ${j.name.toUpperCase()}`;
  if (lt < 0.9) return `${head} · RECEIVED`;
  if (lt < 1.8) return `${head} · SLICING ${j.realLayers} LAYERS`;
  if (t < s.printEnd) return `${head} · ${j.material} · L ${Math.max(1, Math.ceil(span(t, s.t0 + 1.8, s.printEnd) * j.realLayers))}/${j.realLayers}`;
  if (t < s.leave) return j.gears ? `${head} · FIT CHECK` : `${head} · DONE`;
  return `${head} · TO TRAY`;
}

