import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import fontData from "./helvetiker_bold.typeface.json";
import { COMBOS, type KeyTagConfig } from "@/lib/keytag";

// All units are millimetres. Front face is +Z, the tag lies flat.
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);

const D = 3; // body thickness
const RAISE = 0.8; // raised text and rings

type Dim = { w: number; h: number; holeX: number; zone: { cx: number; w: number; h: number } };
const DIMS: Record<KeyTagConfig["style"], Dim> = {
  "data-plate": { w: 60, h: 28, holeX: -23, zone: { cx: 4, w: 40, h: 22 } },
  "license-plate": { w: 64, h: 30, holeX: -25, zone: { cx: 5, w: 40, h: 18 } },
};

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const circle = (r: number, x = 0, y = 0) => {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, false);
  return p;
};

function ring(x: number, rIn: number, rOut: number, side: 1 | -1) {
  const s = new THREE.Shape();
  s.absarc(x, 0, rOut, 0, Math.PI * 2, false);
  s.holes.push(circle(rIn, x, 0));
  const g = new THREE.ExtrudeGeometry(s, { depth: RAISE, bevelEnabled: false, curveSegments: 32 });
  if (side === -1) g.rotateY(Math.PI);
  g.translate(0, 0, side === 1 ? D : 0);
  return g;
}

/** Text fitted into a w x h box (mm) centred at (cx, cy). side -1 puts it on the back face, readable from behind. */
function text(str: string, cx: number, cy: number, w: number, h: number, side: 1 | -1) {
  if (!str.trim()) return null;
  const g = new TextGeometry(str, { font, size: 10, depth: RAISE, curveSegments: 4, bevelEnabled: false });
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  const s = Math.min(w / (b.max.x - b.min.x), h / (b.max.y - b.min.y));
  g.scale(s, s, 1);
  if (side === -1) g.rotateY(Math.PI);
  g.translate(cx, cy, side === 1 ? D : 0);
  return g;
}

/** Body and accent geometry. forPrint lifts the tag so raised back text sits on the bed at z = 0. */
export function buildKeyTag(c: KeyTagConfig, forPrint = false) {
  const d = DIMS[c.style];
  const accent: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry | null) => g && accent.push(g);

  // Body with the keyring hole cut through
  const shape = roundedRect(d.w, d.h, 4);
  shape.holes.push(circle(3, d.holeX, 0));
  const body = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false, curveSegments: 24 });

  // Concentric double ring around the hole on both faces (echoes the logomark)
  for (const side of [1, -1] as const) {
    push(ring(d.holeX, 3.6, 4.6, side));
    push(ring(d.holeX, 5.6, 6.2, side));
  }

  const z = d.zone;
  push(text(c.text, z.cx, 0, z.w, c.style === "data-plate" ? 12 : 13, 1));

  // Back: the zenkilab.com stamp if kept, otherwise blank
  if (c.branding) push(text("zenkilab.com", z.cx, 0, z.w, 5, -1));

  if (c.style === "data-plate") {
    for (const x of [-d.w / 2 + 3, d.w / 2 - 3])
      for (const y of [-d.h / 2 + 3, d.h / 2 - 3]) {
        const g = new THREE.CylinderGeometry(1.2, 1.2, RAISE, 16).rotateX(Math.PI / 2);
        g.translate(x, y, D + RAISE / 2);
        accent.push(g);
      }
  } else {
    // Thin accent border around the text zone, front only
    const bx = d.holeX + 9;
    const bw = d.w / 2 - 2.5 - bx;
    const bh = d.h - 5;
    const outer = roundedRect(bw, bh, 2);
    outer.holes.push(new THREE.Path(roundedRect(bw - 2, bh - 2, 1).getPoints(12).reverse()));
    const g = new THREE.ExtrudeGeometry(outer, { depth: RAISE, bevelEnabled: false });
    g.translate(bx + bw / 2, 0, D);
    accent.push(g);
  }

  const merged = mergeGeometries(accent.map((g) => (g.index ? g.toNonIndexed() : g)), false);
  accent.forEach((g) => g.dispose());
  if (forPrint) {
    body.translate(0, 0, RAISE);
    merged.translate(0, 0, RAISE);
  }
  return { body, accent: merged };
}

/** One mesh per color so AMS slots map one to one. Used by the 3MF export. */
export function buildPrintGroup(c: KeyTagConfig) {
  const { body, accent } = buildKeyTag(c, true);
  const combo = COMBOS[c.combo];
  const b = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: combo.body }));
  b.name = "Body (black)";
  const a = new THREE.Mesh(accent, new THREE.MeshStandardMaterial({ color: combo.accent }));
  a.name = `Accent (${combo.accentName})`;
  const g = new THREE.Group();
  g.name = "ZenkiLab Key Tag";
  g.add(b, a);
  return g;
}
