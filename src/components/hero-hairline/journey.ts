/**
 * The hero and "From idea to finished part" as one drawing. Scroll gives
 * two numbers: x, the hand-off (0 = hero, 1 = story), and p, the story's
 * progress. While x runs, the print queue keeps playing as it slides away
 * and fades, and the first request arrives from the other side; the story's
 * clock runs from -0.1 to 0 over the same stretch, so nothing waits.
 */
import { clamp } from "./hairline";
import * as hero from "./hero";
import * as story from "./story";
import { inout, span, type Item, type View } from "./parts";

export type Scroll = { x: number; p: number };

export const CYCLE = hero.CYCLE;
export const STILL_T = hero.STATIC_T;
export const STEP_STILLS = story.STEP_STILLS;

const storyP = ({ x, p }: Scroll) => p + story.P_MIN * (1 - clamp(x, 0, 1));

export function frame(t: number, view: View, sc: Scroll): Item[] {
  const x = clamp(sc.x, 0, 1), e = inout(x), out: Item[] = [];
  const heroO = 1 - span(x, 0, 0.75), storyO = span(x, 0.2, 1);
  if (heroO > 0.01) {
    for (const it of hero.frame(t, { ...view, dx: view.dx + 60 * e, lift: view.lift + 20 * e, az: view.az - 10 * e }))
      out.push({ ...it, o: Math.round(it.o * heroO * 100) / 100 });
  }
  if (storyO > 0.01) {
    for (const it of story.frame(storyP(sc), { ...view, dx: view.dx - 50 * (1 - e) }))
      out.push({ ...it, o: Math.round(it.o * storyO * 100) / 100 });
  }
  return out.filter((it) => it.o > 0.01);
}

export const caption = (t: number, sc: Scroll) => (sc.x < 0.5 ? hero.caption(t) : story.caption(storyP(sc)));
/** The two read-outs, shown apart: the print queue's under the headline, the story's under the drawing. */
export const heroCaption = hero.caption;
export const storyCaption = (sc: Scroll) => story.caption(storyP(sc));

/** One of the story's still frames, for the stacked version. */
export const still = (p: number) => story.frame(p);
