/**
 * The client side of the journey: one svg, its paths reused frame to frame,
 * a damped pointer viewpoint, and a clock that sleeps when unseen.
 *
 * Two inputs drive it: a clock (the hero's print queue loops on its own) and
 * `scroll()`, which says how far the hand-off and the story have come. Scroll
 * values are followed by springs, so a fast flick still reads as motion.
 *
 * Review aids: ?hero-t=6.2 holds the clock (hero in view); ?story-p=0.4 holds
 * the story at 0.4 (hand-off done), with no spring.
 */
import { clamp, spring, stepS } from "./hairline";
import { CYCLE, STILL_T, frame, heroCaption, storyCaption, type Scroll } from "./journey";
import { span, type Item, type View } from "./parts";

/** What the driver moves besides the drawing: the two read-outs and the planes behind and in front. */
export type Extras = { heroCap?: HTMLElement | null; storyCap?: HTMLElement | null; back?: HTMLElement | null; front?: HTMLElement | null };

const NS = "http://www.w3.org/2000/svg";

export function mount(svg: SVGSVGElement, scroll: () => Scroll, pointerArea: HTMLElement, ui: Extras = {}): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const az = spring(0, { k: 40, c: 12, eps: 0.002 }), kk = spring(0, { k: 40, c: 12, eps: 0.0002 });
  const start = scroll();
  const sx = spring(start.x, { k: 160, c: 25, eps: 0.0004 }), sp = spring(start.p, { k: 160, c: 25, eps: 0.0004 });
  const pool = Array.from(svg.querySelectorAll("path"));
  const last: string[] = [];
  const qs = new URLSearchParams(location.search), qt = qs.get("hero-t"), qp = qs.get("story-p");
  const holdT = qt === null ? null : Number(qt) || 0, holdP = qp === null ? null : Number(qp) || 0;
  let t = holdT ?? STILL_T, raf = 0, prev = 0, seen = true, drawnKey = "";
  const last2: Record<string, string> = {};
  const put = (el: HTMLElement | null | undefined, k: string, v: string, f: (el: HTMLElement, v: string) => void) => {
    if (el && last2[k] !== v) { f(el, v); last2[k] = v; }
  };
  const text = (el: HTMLElement, v: string) => { el.textContent = v; };

  const draw = (time: number, view: View, sc: Scroll) => {
    // the hero's clock only matters while any of the hero is showing
    const key = `${sc.x < 1 ? time.toFixed(4) : "-"}|${sc.x.toFixed(4)}|${sc.p.toFixed(4)}|${view.az.toFixed(3)}|${view.k.toFixed(4)}`;
    if (key === drawnKey) return;
    drawnKey = key;
    const items: Item[] = frame(time, view, sc);
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
    if (sc.x < 1) put(ui.heroCap, "hc", heroCaption(time), text);
    put(ui.storyCap, "sc", storyCaption(sc), text);
    // depth: the planes slide against the drawing with the pointer, and the front one clears off as the story starts
    const bx = (-view.az * 2.2).toFixed(1), by = (view.k * 260).toFixed(1);
    put(ui.back, "bt", `translate3d(${bx}px,${by}px,0)`, (el, v) => { el.style.transform = v; });
    put(ui.front, "ft", `translate3d(${(view.az * 5.5).toFixed(1)}px,${(-view.k * 600 - 40 * sc.x).toFixed(1)}px,0)`, (el, v) => { el.style.transform = v; });
    put(ui.front, "fo", (1 - span(sc.x, 0, 0.45)).toFixed(2), (el, v) => { el.style.opacity = v; });
    put(ui.storyCap, "so", span(sc.x, 0.35, 0.75).toFixed(2), (el, v) => { el.style.opacity = v; });
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    stepS(az, dt); stepS(kk, dt);
    const s = holdP !== null ? { x: 1, p: holdP } : holdT !== null ? { x: 0, p: 0 } : scroll();
    sx.t = clamp(s.x, 0, 1); sp.t = clamp(s.p, 0, 1);
    if (holdP !== null || holdT !== null) { sx.x = sx.t; sp.x = sp.t; }
    stepS(sx, dt); stepS(sp, dt);
    t = holdT ?? (t + dt) % CYCLE;
    draw(t, { az: az.x, k: kk.x, lift: 0, dx: 0 }, { x: sx.x, p: sp.x });
    raf = requestAnimationFrame(tick);
  };

  const sync = () => {
    const go = seen && !document.hidden && !reduce.matches;
    if (go && !raf) { prev = performance.now(); raf = requestAnimationFrame(tick); }
    if (!go && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (reduce.matches) draw(STILL_T, { az: 0, k: 0, lift: 0, dx: 0 }, { x: 0, p: 0 });
  };

  // mouse and pen only: a finger scrolling the page should not tilt the drawing
  const move = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = pointerArea.getBoundingClientRect();
    az.t = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1) * 5;
    kk.t = -clamp((e.clientY / innerHeight) * 2 - 1, -1, 1) * 0.035;
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
