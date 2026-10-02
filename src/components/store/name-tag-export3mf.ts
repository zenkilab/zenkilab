import * as THREE from "three";
import { exportTo3MF } from "three-3mf-exporter";
import { MATERIAL } from "@/lib/keytag";
import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";
import { loadImage } from "./name-tag-art";
import { FLOOR, raisedParts } from "./name-tag-raised";

// Millimetres. Back face at z = 0 (prints face down), 1.6 mm floor, 0.8 mm raised parts on top.
// Three meshes so the slicer gets three filament slots: 1 body, 2 accent (logo, rule), 3 lettering.
// The raised parts are built from the same drawing as the 3D preview, see name-tag-raised.ts.
const RADIUS = 4;
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
      const r = raisedParts(p.concept, s, logo, p.font, p.accent, ox, oy);
      accent.push(...r.accent);
      ink.push(...r.ink);
    });
    const group = new THREE.Group();
    group.name = `Name tags ${start + 1}-${start + chunk.length}`;
    group.add(mesh(body, c.solid, "Body"), mesh(accent, p.accent, "Logo and rule"), mesh(ink, c.name, "Lettering"));
    files.push(await exportTo3MF(group, { filament: `Generic ${MATERIAL}` }));
  }
  floor.dispose();
  return files;
}
