/**
 * The client side of a Hairline scene: one svg, its paths reused frame to
 * frame, a damped pointer viewpoint, and a clock that sleeps when unseen.
 *
 * - loop:  time runs on its own (the hero). `leaving()` (0 → 1 as the hero
 *          scrolls away) lifts the drawing a little and speeds it up a touch;
 *          it never scrubs or resets the loop.
 * - scrub: time is wherever `target()` says (scroll progress), followed by a
 *          spring so fast scrolling still reads as motion.
 */
import { clamp, spring, stepS } from "./hairline";
import type { Item, View } from "./parts";

export type Scene = {
  frame: (t: number, view: View) => Item[];
  caption?: (t: number) => string;
  /** The time drawn under reduced motion, and where the clock starts (matching the server's picture). */
  still: number;
  /** URL parameter that holds the clock still for review, e.g. ?hero-t=6.2 */
  freeze: string;
};

export type Drive =
  | { mode: "loop"; cycle: number; leaving?: () => number }
  | { mode: "scrub"; target: () => number };

const NS = "http://www.w3.org/2000/svg";

export function mount(svg: SVGSVGElement, scene: Scene, drive: Drive, pointerArea: HTMLElement, captionEl?: HTMLElement | null): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const az = spring(0, { k: 40, c: 12, eps: 0.002 }), kk = spring(0, { k: 40, c: 12, eps: 0.0002 });
  const tt = spring(drive.mode === "scrub" ? drive.target() : 0, { k: 160, c: 25, eps: 0.0004 });
  const pool = Array.from(svg.querySelectorAll("path"));
  const last: string[] = [];
  const q = new URLSearchParams(location.search).get(scene.freeze);
  const freeze = q === null ? null : Number(q) || 0;
  let t = scene.still, raf = 0, prev = 0, seen = true, drawnKey = "", lastCaption = "";

  const draw = (time: number, view: View) => {
    const key = `${time.toFixed(4)}|${view.az.toFixed(3)}|${view.k.toFixed(4)}|${view.lift.toFixed(2)}`;
    if (key === drawnKey) return;
    drawnKey = key;
    const items = scene.frame(time, view);
    for (let i = 0; i < Math.max(items.length, pool.length); i++) {
      let el = pool[i];
      if (!el) { el = document.createElementNS(NS, "path"); svg.appendChild(el); pool.push(el); }
      const it = items[i], k = it ? it.d + "|" + it.c + "|" + it.o : "";
      if (last[i] === k) continue;
      last[i] = k;
      el.setAttribute("d", it ? it.d : "");
      el.setAttribute("class", it ? it.c : "");
      el.setAttribute("opacity", it ? String(it.o) : "0");
    }
    const cap = scene.caption?.(time) ?? "";
    if (captionEl && cap !== lastCaption) { captionEl.textContent = cap; lastCaption = cap; }
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    stepS(az, dt); stepS(kk, dt);
    let lift = 0;
    if (drive.mode === "loop") {
      const away = drive.leaving ? clamp(drive.leaving(), 0, 1) : 0;
      lift = -28 * away;
      t = freeze ?? (t + dt * (1 + 0.6 * away)) % drive.cycle;
    } else {
      tt.t = freeze ?? drive.target();
      if (freeze !== null) tt.x = tt.t; // review: land exactly, no spring
      stepS(tt, dt);
      t = tt.x;
    }
    draw(t, { az: az.x, k: kk.x + (drive.mode === "loop" ? 0.05 * (-lift / 28) : 0), lift });
    raf = requestAnimationFrame(tick);
  };

  const sync = () => {
    const go = seen && !document.hidden && !reduce.matches;
    if (go && !raf) { prev = performance.now(); raf = requestAnimationFrame(tick); }
    if (!go && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (reduce.matches) draw(scene.still, { az: 0, k: 0, lift: 0 });
  };

  // mouse and pen only: a finger scrolling the page should not tilt the drawing
  const move = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = pointerArea.getBoundingClientRect();
    az.t = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1) * 5;
    kk.t = -clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1) * 0.035;
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
