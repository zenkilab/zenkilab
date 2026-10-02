import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";
import { drawArt } from "./name-tag-art";

// The raised parts (logo, rule, lettering) as real boxes, shared by the 3D preview and the print
// file so what you see is what is printed. The drawing is read at PX pixels per mm (0.083 mm,
// well under the nozzle) and merged into the fewest rectangles.
export const FLOOR = 1.6;
export const RAISE = 0.8;
export const PX = 12;

/** Rectangles (in pixels) covering every white pixel, row runs joined downwards. */
function rects(cv: HTMLCanvasElement) {
  const { width: w, height: h } = cv;
  const d = cv.getContext("2d")!.getImageData(0, 0, w, h).data;
  const out: [number, number, number, number][] = []; // x0, y0, x1, y1
  let open = new Map<string, number>(); // "x0:x1" -> first row of the run
  for (let y = 0; y <= h; y++) {
    const now = new Map<string, number>();
    if (y < h) {
      let x = 0;
      while (x < w) {
        if (d[(y * w + x) * 4] > 127) {
          const x0 = x;
          while (x < w && d[(y * w + x) * 4] > 127) x++;
          const key = `${x0}:${x}`;
          now.set(key, open.get(key) ?? y);
        } else x++;
      }
    }
    for (const [key, y0] of open) if (!now.has(key)) { const [x0, x1] = key.split(":").map(Number); out.push([x0, y0, x1, y]); }
    open = now;
  }
  return out;
}

/** Boxes as a flat triangle list. Faces glued to a neighbour are kept: the slicer unions touching solids. */
function boxes(list: [number, number, number, number][], w: number, h: number, ox: number, oy: number) {
  const pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  const z0 = FLOOR, z1 = FLOOR + RAISE;
  for (const [px0, py0, px1, py1] of list) {
    const x0 = ox + px0 / PX - w / 2, x1 = ox + px1 / PX - w / 2;
    const y1 = oy + h / 2 - py0 / PX, y0 = oy + h / 2 - py1 / PX;
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); // top
    quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]); // bottom
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]); // front (y0)
    quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]); // back (y1)
    quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]); // left
    quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); // right
  }
  return pos;
}

/** Triangle positions for one badge centred at (ox, oy): accent (logo, rule) and ink (lettering). */
export function raisedParts(concept: ConceptId, staff: Staff, logo: HTMLImageElement, font: string, accent: string, ox = 0, oy = 0) {
  const c = CONCEPTS[concept];
  const part = (mode: "accent" | "ink") => boxes(rects(drawArt(concept, staff, logo, font, accent, PX, mode)), c.w, c.h, ox, oy);
  return { accent: part("accent"), ink: part("ink") };
}
