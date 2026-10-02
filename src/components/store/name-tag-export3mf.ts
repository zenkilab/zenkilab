import * as THREE from "three";
import { exportTo3MF } from "three-3mf-exporter";
import { MATERIAL } from "@/lib/keytag";
import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";
import { drawArt, loadImage } from "./name-tag-art";

// Millimetres. Back face at z = 0 (prints face down), 1.6 mm floor, 0.8 mm raised parts on top.
// Three meshes so the slicer gets three filament slots: 1 body, 2 accent (logo, rule), 3 lettering.
// The raised parts are built from the same drawing as the 3D preview, read at 8 pixels per mm
// (0.125 mm, finer than the nozzle) and merged into the fewest rectangles.
const FLOOR = 1.6;
const RAISE = 0.8;
const RADIUS = 4;
const PX = 8;
const GAP = 5; // between badges on the plate
const COLS = 3;
export const PER_PLATE = 12; // 3 x 4 fits the 256 mm bed for both sizes

export type NameTagPrint = { concept: ConceptId; accent: string; font: string; logo: string; staff: Staff[] };

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}

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

const mesh = (pos: number[], color: string, name: string) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color }));
  m.name = name;
  return m;
};

/** One 3MF per plate of up to PER_PLATE badges. Returns the files in order. */
export async function buildNameTag3MFs(p: NameTagPrint): Promise<Blob[]> {
  const c = CONCEPTS[p.concept];
  const logo = await loadImage(p.logo);
  await Promise.all([document.fonts.load(`600 20px "${p.font}"`), document.fonts.load(`500 20px "${p.font}"`)]);

  const floor = new THREE.ExtrudeGeometry(roundedRect(c.w, c.h, RADIUS), { depth: FLOOR, bevelEnabled: false, curveSegments: 24 });
  const floorPos = floor.attributes.position.array;

  const files: Blob[] = [];
  for (let start = 0; start < p.staff.length; start += PER_PLATE) {
    const chunk = p.staff.slice(start, start + PER_PLATE);
    const body: number[] = [], accent: number[] = [], ink: number[] = [];
    chunk.forEach((s, i) => {
      const ox = (i % COLS) * (c.w + GAP), oy = -Math.floor(i / COLS) * (c.h + GAP);
      for (let k = 0; k < floorPos.length; k += 3) body.push(floorPos[k] + ox, floorPos[k + 1] + oy, floorPos[k + 2]);
      accent.push(...boxes(rects(drawArt(p.concept, s, logo, p.font, p.accent, PX, "accent")), c.w, c.h, ox, oy));
      ink.push(...boxes(rects(drawArt(p.concept, s, logo, p.font, p.accent, PX, "ink")), c.w, c.h, ox, oy));
    });
    const group = new THREE.Group();
    group.name = `Name tags ${start + 1}-${start + chunk.length}`;
    group.add(mesh(body, c.solid, "Body"), mesh(accent, p.accent, "Logo and rule"), mesh(ink, c.name, "Lettering"));
    files.push(await exportTo3MF(group, { filament: `Generic ${MATERIAL}` }));
  }
  floor.dispose();
  return files;
}
