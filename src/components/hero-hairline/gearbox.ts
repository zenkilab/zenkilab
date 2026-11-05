/**
 * Gearbox: a custom Hairline figure. An open gearbox is sketched, designed,
 * its housing printed layer by layer, its gears and shafts lowered in, and
 * then it runs. Illustrative mechanism, not a product.
 *
 * `frame(t, view)` is pure: it returns the paths for time t, painted back to
 * front in Hairline's manner (opaque plates, no hidden-line removal). The
 * server renders one frame as the static picture; `mount` drives the same
 * paths on the client.
 */
import {
  Cam, EASE_LIFT, bezier, circ, clamp, facing, fit, hull, lerp, open, poly, proj, ringAt, rrect, run, seg, spring, stepS,
  type Ring, type Sample, type Vec2, type Vec3,
} from "./hairline";

export type Item = { d: string; c: string; o: number };

/* ---------- the mechanism, in world units ---------- */

export const M = 3.5; // module
export const N1 = 12, N2 = 18; // 2:3, so the big gear turns at 2/3 the speed of the small one
const R1 = (M * N1) / 2, R2 = (M * N2) / 2; // pitch radii 21, 31.5
export const X1 = -31.5, X2 = X1 + R1 + R2; // centre distance = R1 + R2
const H = 20, FLOOR = 5, LAYER = 2.5, LAYERS = H / LAYER;
const BOSS_R = 8, BOSS_Z = 10, SHAFT_R = 3.2, SHAFT_TOP = 30;
const GZ0 = 14, GT = 7, HUB_R = 7.5, HUB_H = 2.5; // gear sits just above the rim
const SHAFT_LIFT = 22, GEAR_LIFT = 42; // exploded / arrival offsets
const OUT = rrect(-69, -48, 69, 48, 9, 6), IN = rrect(-63, -42, 63, 42, 3.5, 5);
const CENTRES: [number, number][] = [[X1, 0], [X2, 0]];
const SHAFT = circ(SHAFT_R, 20), BOSS = circ(BOSS_R, 32), HUB = circ(HUB_R, 28), MARK = circ(1.5, 10);
const W1 = 0.55; // rad/s of the small gear

/** One gear's outline as [angle, radius] vertices: a trapezoid tooth with backlash, ~ involute in silhouette. */
export function profile(N: number): [number, number][] {
  const r = (M * N) / 2, rr = r - 1.25 * M, ra = r + M, p = (2 * Math.PI) / N, out: [number, number][] = [];
  for (let k = 0; k < N; k++) {
    const c = k * p;
    out.push([c - 0.29 * p, rr], [c - 0.225 * p, r], [c - 0.12 * p, ra], [c + 0.12 * p, ra], [c + 0.225 * p, r], [c + 0.29 * p, rr], [c + 0.5 * p, rr - 0.15]);
  }
  return out;
}
const PROF1 = profile(N1), PROF2 = profile(N2);

/** Opposite directions, speeds in the inverse ratio of tooth counts; gear 2 starts with a gap facing gear 1's tooth. */
export const angles = (th1: number): [number, number] => [th1, Math.PI - Math.PI / N2 - (N1 / N2) * th1];

export const gearXY = (prof: [number, number][], cx: number, th: number): Vec2[] =>
  prof.map(([a, r]) => [cx + r * Math.cos(a + th), r * Math.sin(a + th)]);

/* ---------- timeline (seconds) ---------- */

export const CYCLE = 16;
export const STATIC_T = 13.9; // the finished, running state: the poster frame
const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const inout = bezier(0.65, 0, 0.35, 1);
const PRINT0 = 5.4, LAYER_S = 0.5, PRINT1 = PRINT0 + LAYERS * LAYER_S; // 9.4
const DEMO0 = 11.9;

/** θ of the small gear: ramps up over 0.8 s, then turns at W1. */
function theta(t: number) {
  const tau = t - DEMO0, ramp = 0.8;
  if (tau <= 0) return 0;
  return tau < ramp ? (W1 * tau * tau) / (2 * ramp) : W1 * (tau - ramp / 2);
}

/* ---------- framing ---------- */

const S = 1.95;
const box = (z: number): Vec3[] => [[-69, -48, z], [69, -48, z], [69, 48, z], [-69, 48, z]];
const REST: Vec3[] = [...box(0), ...box(H + 6)];
const TALL: Vec3[] = [...box(0), ...box(GZ0 + GT + GEAR_LIFT)];

/* ---------- small helpers ---------- */

const off = (ring: Ring, dx: number, dy: number): Ring => ring.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));

/** The first fraction f of a polyline, by length. */
function trace(pts: Vec2[], f: number): Vec2[] {
  if (f <= 0) return [];
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
const closed = (pts: Vec2[]): Vec2[] => [...pts, pts[0]];

/* ---------- the nozzle's path for one layer, as world [x, y] polylines ---------- */

function layerPaths(i: number): Vec2[][] {
  const top = (i + 1) * LAYER;
  const ring = (r: Ring) => closed(r.map((q) => [q.u, q.v] as Vec2));
  const paths = [ring(OUT)];
  if (top <= FLOOR) {
    // floor: a raster of infill across the cavity, alternating direction per layer
    const zig: Vec2[] = [];
    for (let k = 0, y = -38; y <= 38; y += 9.5, k++) {
      const row: Vec2[] = [[-59, y], [59, y]];
      zig.push(...(k % 2 ? row.reverse() : row));
    }
    paths.push(i % 2 ? zig.map(([x, y]) => [-x, -y] as Vec2) : zig);
  } else {
    paths.push(ring(IN));
    if (top <= BOSS_Z) for (const [cx] of CENTRES) paths.push(ring(off(BOSS, cx, 0)));
  }
  return paths;
}
const LAYER_PATHS = Array.from({ length: LAYERS }, (_, i) => layerPaths(i));

/** Where the nozzle is after fraction f of layer i, and the trail laid so far. */
function nozzleAt(i: number, f: number): { at: Vec2; trail: Vec2[][] } {
  const paths = LAYER_PATHS[i];
  const lens = paths.map((p) => p.slice(1).reduce((s, q, k) => s + Math.hypot(q[0] - p[k][0], q[1] - p[k][1]), 0));
  let left = lens.reduce((a, b) => a + b, 0) * f;
  const trail: Vec2[][] = [];
  for (let k = 0; k < paths.length; k++) {
    if (left >= lens[k]) { trail.push(paths[k]); left -= lens[k]; continue; }
    const part = trace(paths[k], left / lens[k]);
    trail.push(part);
    return { at: part.length ? part[part.length - 1] : paths[k][0], trail };
  }
  const last = paths[paths.length - 1];
  return { at: last[last.length - 1], trail };
}

/* ---------- the frame ---------- */

export type View = { az: number; k: number };

export function frame(t: number, view: View = { az: 0, k: 0 }): Item[] {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const out: Item[] = [];
  const reset = 1 - span(t, 15.4, 16);
  const add = (d: string, c: string, o = 1) => { o *= reset; if (d && o > 0.01) out.push({ d, c, o: Math.round(o * 100) / 100 }); };

  // phases
  const depth = EASE_LIFT(span(t, 2.4, 3.3));
  const explode = inout(span(t, 3.3, 4.1));
  const designGone = span(t, 4.4, 5.0);
  const sketch = 1 - span(t, 2.6, 3.4);
  const axes = Math.max(t < 5 ? 1 - designGone : 0, span(t, 9.8, 10.2) * (1 - span(t, 11.6, 12.2)), t < 0.6 ? 1 : 0);
  const ghost = span(t, 4.4, 5.0) * (1 - span(t, PRINT1, PRINT1 + 0.6));
  const parts = t < 5 ? (t >= 2.4 ? 1 - designGone : 0) : span(t, 9.8, 10.2);
  const shaftDrop = t < 5 ? explode : 1 - inout(span(t, 10.0, 10.8));
  const gearDrop = t < 5 ? explode : 1 - inout(span(t, 10.7, 11.8));

  // camera: Hairline's 2:1 view, nudged by the pointer, framed for the tallest pose in play
  const C = Cam(45 + view.az, 0.5 + view.k, S);
  const tall = Math.max(t < 5 ? explode * (1 - designGone) : 0, t >= 9.6 ? 1 - span(t, 10.7, 11.8) : 0);
  fit(C, REST, 200, 170);
  const rx = C.ox, ry = C.oy;
  fit(C, TALL, 200, 170);
  C.ox = lerp(rx, C.ox, tall * 0.85); C.oy = lerp(ry, C.oy, tall * 0.85);
  const P = proj(C), front = facing(C), back = (q: Sample) => !front(q);
  const at = (r: Ring, z: number) => ringAt(P, r, z);

  /* sketch: construction lines trace the housing, shaft centres and gear profiles */
  if (t < 3.4) {
    const tr = (pts: Vec2[], a: number, b: number, c: string) => add(open(trace(pts, span(t, a, b))), c, sketch);
    tr(closed(at(OUT, 0)), 0.3, 1.3, "nf sil");
    tr(closed(at(IN, 0)), 0.6, 1.5, "nf lo");
    CENTRES.forEach(([cx], i) => {
      const r = i ? R2 : R1;
      tr(closed(circ(r, 64).map((q) => P(q.u + cx, q.v, GZ0 + GT))), 0.8 + i * 0.2, 1.6 + i * 0.2, "nf dash lo");
      const g = gearXY(i ? PROF2 : PROF1, cx, angles(0)[i]).map(([x, y]) => P(x, y, GZ0 + GT));
      tr(closed(g), 1.0 + i * 0.2, 2.0 + i * 0.2, "nf sil");
      // centre cross on the floor
      const c0 = P(cx, 0, 0), k = span(t, 0.1 + i * 0.1, 0.5 + i * 0.1) * 6;
      add(seg([c0[0] - k, c0[1]], [c0[0] + k, c0[1]]) + seg([c0[0], c0[1] - k / 2], [c0[0], c0[1] + k / 2]), "nf lo", sketch);
    });
  }

  /* shaft centre lines: drawn first in the sketch, kept through design and assembly */
  if (axes > 0.01) CENTRES.forEach(([cx], i) => {
    const grow = span(t, 0.1 + i * 0.1, 0.6 + i * 0.1);
    add(seg(P(cx, 0, 0), P(cx, 0, lerp(0, SHAFT_TOP + GEAR_LIFT + 10, t < 1 ? grow : 1))), "nf dash lo", axes);
  });

  /* the dashed target the printer is building toward */
  if (ghost > 0.01) {
    const f = run(OUT, front), l = f[0], r = f[f.length - 1];
    add(poly(at(OUT, H)) + open(at(f, 0)) + seg(P(l.u, l.v, 0), P(l.u, l.v, H)) + seg(P(r.u, r.v, 0), P(r.u, r.v, H)), "nf dash lo", ghost);
  }

  /* the housing and what sits in it */
  let h = 0, layers = false, ho = 1;
  if (t >= 2.4 && t < 5) { h = H * depth; ho = 1 - designGone; }
  else if (t >= PRINT0) { h = Math.min(LAYERS, Math.floor((t - PRINT0) / LAYER_S)) * LAYER; layers = true; }
  const lip: (() => void)[] = [];
  if (h > 0.05 && ho > 0.01) {
    const fo = run(OUT, front), fi = run(IN, front);
    add(poly(hull(at(OUT, h).concat(at(OUT, 0)))), "sil", ho);
    if (h <= FLOOR) {
      add(open(at(fo, h)), "nf", ho);
      if (layers) for (let z = LAYER; z < h - 0.01; z += LAYER) add(open(at(fo, z)), "nf lo", ho);
    } else {
      add(poly(at(IN, h)), "", ho);
      const fb = run(IN, back);
      add(open(at(fb, FLOOR)) + seg(P(fb[0].u, fb[0].v, h), P(fb[0].u, fb[0].v, FLOOR)) + seg(P(fb[fb.length - 1].u, fb[fb.length - 1].v, h), P(fb[fb.length - 1].u, fb[fb.length - 1].v, FLOOR)), "nf lo", ho);
      const hb = Math.min(h, BOSS_Z);
      for (const [cx] of CENTRES) {
        const b = off(BOSS, cx, 0);
        add(poly(hull(at(b, hb).concat(at(b, FLOOR)))), "sil", ho);
        add(poly(at(b, hb)), "nf", ho);
        add(poly(at(off(SHAFT, cx, 0), hb)), "nf lo", ho);
      }
      // the near wall, painted after the contents so it hides what is below the rim
      lip.push(() => {
        const A = at(fo, 0), B = at(fi, h).reverse(), o0 = P(fo[0].u, fo[0].v, h), o1 = P(fo[fo.length - 1].u, fo[fo.length - 1].v, h);
        add(poly([...A, o1, ...B, o0]), "fo", ho);
        if (layers) for (let z = LAYER; z < h - 0.01; z += LAYER) add(open(at(fo, z)), "nf lo", ho);
        add(open(at(fo, h)) + open(at(fi, h)), "nf", ho);
        add(open([o0, ...A, o1]), "nf sil", ho);
      });
    }
  }

  /* shafts and gears */
  if (parts > 0.01) {
    const [th1, th2] = angles(theta(t));
    const so = SHAFT_LIFT * shaftDrop, go = GEAR_LIFT * gearDrop;
    const gt = t < 5 ? GT * depth : GT;
    const g1 = GZ0 + GT + go, g0 = g1 - gt; // gear bottom and top
    CENTRES.forEach(([cx], i) => {
      const s0 = Math.max(FLOOR + so, h > FLOOR ? BOSS_Z : 0), s1 = SHAFT_TOP + so, sh = off(SHAFT, cx, 0);
      const cyl = (a: number, b: number) => {
        if (b - a < 0.2) return;
        add(poly(hull(at(sh, b).concat(at(sh, a)))), "sil", parts);
        add(poly(at(sh, b)), "nf", parts);
      };
      const hubTop = g1 + HUB_H;
      cyl(s0, Math.min(s1, g0));
      // the gear: two outlines and the fills between them make its thickness
      const xy = gearXY(i ? PROF2 : PROF1, cx, i ? th2 : th1);
      const ring = (z: number) => xy.map(([x, y]) => P(x, y, z));
      add(poly(ring(g0)), "lo", parts);
      for (let j = 1; j < 4; j++) add(poly(ring(lerp(g0, g1, j / 4))), "fo", parts);
      add(poly(ring(g1)), "sil", parts);
      add(poly(circ(i ? R2 - 2.2 * M : R1 - 2.2 * M, 48).map((q) => P(q.u + cx, q.v, g1))), "nf lo", parts);
      const hub = off(HUB, cx, 0);
      add(poly(hull(at(hub, hubTop).concat(at(hub, g1)))), "sil", parts);
      add(poly(at(hub, hubTop)), "nf", parts);
      // timing marks: a tooth of gear 1 and the gap of gear 2 that meet it
      if (t >= DEMO0 - 0.6) {
        const r = (i ? R2 : R1) - 1.9 * M, a = i ? th2 + Math.PI / N2 : th1;
        add(poly(at(off(MARK, cx + r * Math.cos(a), r * Math.sin(a)), g1)), "ambdot", parts * span(t, DEMO0 - 0.6, DEMO0));
      }
      if (s1 > hubTop) cyl(Math.max(s0, hubTop), s1);
      else if (s1 > g0 && s0 < g0) { /* shaft is inside the bore: hidden by the gear */ }
    });
  }

  lip.forEach((f) => f());

  /* the active layer in amber, and the nozzle laying it */
  const noz = span(t, 5.0, 5.3) * (1 - span(t, PRINT1 + 0.2, PRINT1 + 0.5));
  if (noz > 0.01) {
    const i = clamp(Math.floor((t - PRINT0) / LAYER_S), 0, LAYERS - 1);
    const f = t < PRINT0 ? 0 : t >= PRINT1 ? 1 : ((t - PRINT0) % LAYER_S) / LAYER_S;
    const z = (i + 1) * LAYER;
    const { at: [nx, ny], trail } = nozzleAt(i, f);
    if (t >= PRINT0 && t < PRINT1) add(trail.map((p) => open(p.map(([x, y]) => P(x, y, z)))).join(""), "nf amb");
    const lift = 34 * (1 - EASE_LIFT(span(t, 5.0, 5.4))) + 34 * inout(span(t, PRINT1, PRINT1 + 0.5));
    const zn = z + lift + 0.4;
    const tip = off(circ(1.1, 12), nx, ny), cone = off(circ(4.2, 16), nx, ny), block = rrect(nx - 6, ny - 6, nx + 6, ny + 6, 2, 3);
    add(seg(P(nx, ny, zn + 16), P(nx, ny, zn + 44)), "nf lo", noz);
    add(poly(hull(at(tip, zn).concat(at(cone, zn + 6)))), "sil", noz);
    add(poly(hull(at(block, zn + 6).concat(at(block, zn + 16)))), "sil", noz);
    add(open(at(run(block, front), zn + 16)), "nf lo", noz);
  }

  return out;
}

/* ---------- the client: one clock, a damped viewpoint, paused when unseen ---------- */

export function mount(svg: SVGSVGElement, pointerArea: HTMLElement): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const az = spring(0, { k: 40, c: 12, eps: 0.002 }), kk = spring(0, { k: 40, c: 12, eps: 0.0002 });
  const pool = Array.from(svg.querySelectorAll("path"));
  const last: string[] = [];
  // start on the poster frame the server drew, so nothing jumps; the loop resets into the sketch a moment later
  let t = STATIC_T, raf = 0, prev = 0, seen = true;
  // review aid: ?hero-t=6.2 holds the clock at 6.2 s so one stage can be inspected
  const q = new URLSearchParams(location.search).get("hero-t"), freeze = q === null ? null : Number(q) || 0;

  const draw = (items: Item[]) => {
    for (let i = 0; i < Math.max(items.length, pool.length); i++) {
      let el = pool[i];
      if (!el) { el = document.createElementNS("http://www.w3.org/2000/svg", "path"); svg.appendChild(el); pool.push(el); }
      const it = items[i], key = it ? it.d + "|" + it.c + "|" + it.o : "";
      if (last[i] === key) continue;
      last[i] = key;
      el.setAttribute("d", it ? it.d : "");
      el.setAttribute("class", it ? it.c : "");
      el.setAttribute("opacity", it ? String(it.o) : "0");
    }
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    t = freeze ?? (t + dt) % CYCLE;
    stepS(az, dt); stepS(kk, dt);
    draw(frame(t, { az: az.x, k: kk.x }));
    raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    const go = seen && !document.hidden && !reduce.matches;
    if (go && !raf) { prev = performance.now(); raf = requestAnimationFrame(tick); }
    if (!go && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (reduce.matches) { az.x = az.t = kk.x = kk.t = 0; draw(frame(STATIC_T)); }
  };

  // mouse and pen only: a finger scrolling the page should not tilt the drawing
  const move = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = pointerArea.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    az.t = nx * 5; kk.t = -ny * 0.035;
  };
  const leave = () => { az.t = 0; kk.t = 0; };

  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { rootMargin: "80px" });
  io.observe(svg);
  pointerArea.addEventListener("pointermove", move);
  pointerArea.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", sync);
  reduce.addEventListener("change", sync);
  sync();

  return () => {
    cancelAnimationFrame(raf); raf = 0;
    io.disconnect();
    pointerArea.removeEventListener("pointermove", move);
    pointerArea.removeEventListener("pointerleave", leave);
    document.removeEventListener("visibilitychange", sync);
    reduce.removeEventListener("change", sync);
  };
}
