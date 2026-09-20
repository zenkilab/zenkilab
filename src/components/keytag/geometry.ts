import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import fontData from "./spacegrotesk_bold.typeface.json";
import { COMBOS, TAG, type KeyTagConfig } from "@/lib/keytag";

// All units are millimetres. Front face is +Z, the tag lies flat.
// FRONT: a raised rim, one ring around the keyring hole and raised lettering stand TAG.EMBOSS
// above a recessed floor.
// BACK: completely flat. If the marketing line is kept it is a flush color inlay (no relief).
// Floor and accent are separate meshes so the printer can use two colors.
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);

const { W, H, FLOOR: F, EMBOSS: E, INLAY: I, RIM, HOLE_R, HOLE_X } = TAG;
const BOSS = 1.3; // width of the single ring around the keyring hole

/** Capsule (stadium) outline in the XY plane, centred on the origin, shrunk by `inset`. */
function capsule(inset = 0) {
  const R = H / 2 - inset;
  const L = W / 2 - H / 2;
  const s = new THREE.Shape();
  s.moveTo(-L, -R);
  s.lineTo(L, -R);
  s.absarc(L, 0, R, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-L, R);
  s.absarc(-L, 0, R, Math.PI / 2, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

const circle = (r: number, x = 0, y = 0) => {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, false);
  return p;
};

const extrude = (shape: THREE.Shape, depth: number, z: number) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, z);
  return g;
};

/** Raised rim on the front face */
function rimBand() {
  const outer = capsule(0);
  outer.holes.push(new THREE.Path(capsule(RIM).getPoints(64).reverse()));
  return extrude(outer, E, F);
}

/** The single ring around the keyring hole, front face */
function boss() {
  const s = new THREE.Shape();
  s.absarc(HOLE_X, 0, HOLE_R + BOSS, 0, Math.PI * 2, false);
  s.holes.push(circle(HOLE_R, HOLE_X, 0));
  return extrude(s, E, F);
}

/** Raised lettering fitted into a w x h box (mm) centred at (cx, cy), front face. */
function frontText(str: string, cx: number, cy: number, w: number, h: number) {
  if (!str.trim()) return null;
  const g = new TextGeometry(str, { font, size: 10, depth: E, curveSegments: 6, bevelEnabled: false });
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  const s = Math.min(w / (b.max.x - b.min.x), h / (b.max.y - b.min.y));
  g.scale(s, s, 1);
  g.translate(cx, cy, F);
  return g;
}

type Glyph = { outer: THREE.Vector2[]; counters: THREE.Vector2[][] };

/** Letter outlines fitted into a w x h box centred at (cx, cy), mirrored so they read correctly from behind. */
function backOutlines(str: string, cx: number, cy: number, w: number, h: number): Glyph[] {
  const raw = font.generateShapes(str, 10).map((sh) => {
    const p = sh.extractPoints(10);
    return { outer: p.shape, counters: p.holes };
  });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const g of raw) for (const v of g.outer) {
    x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
  }
  const s = Math.min(w / (x1 - x0), h / (y1 - y0));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const map = (v: THREE.Vector2) => new THREE.Vector2(cx - (v.x - mx) * s, cy + (v.y - my) * s);
  return raw.map((g) => ({ outer: g.outer.map(map), counters: g.counters.map((c) => c.map(map)) }));
}

/** Closed box with its faces turned inside out, so a slicer reads it as a hollow. */
function voidBox(w: number, h: number, t: number, x: number, z: number) {
  const b = new THREE.BoxGeometry(w, h, t);
  const idx = b.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = b.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  b.translate(x, 0, z);
  return b.toNonIndexed();
}

const flat = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

// Lettering zone: right of the ring around the hole, inside the rim
const ZONE_L = HOLE_X + HOLE_R + BOSS + 2.4;
const ZONE_R = W / 2 - RIM - 2.6;
const ZONE = { cx: (ZONE_L + ZONE_R) / 2, w: ZONE_R - ZONE_L, h: 9 };

/** Floor (black) and rim, ring and lettering (accent). Model z: back face at 0, front rim and lettering up to F + E. */
export function buildKeyTag(c: KeyTagConfig) {
  const bodyParts: THREE.BufferGeometry[] = [];
  const accent: THREE.BufferGeometry[] = [];

  const floorShape = (holes: THREE.Path[] = []) => {
    const s = capsule(0);
    s.holes.push(circle(HOLE_R, HOLE_X, 0), ...holes);
    return s;
  };

  if (c.branding) {
    // Flush inlay on the back: the marketing line replaces the bottom INLAY mm of the floor
    const glyphs = backOutlines("ZenkiLab.com", ZONE.cx, 0, ZONE.w, 6);
    const bottom = floorShape(glyphs.map((g) => new THREE.Path(g.outer)));
    bodyParts.push(flat(extrude(bottom, I, 0)));
    for (const g of glyphs) {
      // counters (the middle of an "a" or "b") stay floor, letters fill with the accent color
      for (const counter of g.counters) bodyParts.push(flat(extrude(new THREE.Shape(counter), I, 0)));
      const letter = new THREE.Shape(g.outer);
      letter.holes = g.counters.map((cn) => new THREE.Path(cn));
      accent.push(extrude(letter, I, 0));
    }
    bodyParts.push(flat(extrude(floorShape(), F - I, I)));
  } else {
    bodyParts.push(flat(extrude(floorShape(), F, 0)));
  }

  if (c.rfid) {
    // Sealed pocket for a 20 x 10 mm wet inlay, inside the floor
    const { w, h, t, cx, zc } = TAG.POCKET;
    bodyParts.push(voidBox(w, h, t, cx, zc));
  }

  accent.push(rimBand(), boss());
  const t = frontText(c.text, ZONE.cx, 0, ZONE.w, ZONE.h);
  if (t) accent.push(t);

  const body = mergeGeometries(bodyParts, false);
  const merged = mergeGeometries(accent.map(flat), false);
  bodyParts.forEach((g) => g.dispose());
  accent.forEach((g) => g.dispose());
  return { body, accent: merged };
}

/** One mesh per color so AMS slots map one to one. Used by the 3MF export. The back is flat, so it prints face down on the bed. */
export function buildPrintGroup(c: KeyTagConfig) {
  const { body, accent } = buildKeyTag(c);
  const combo = COMBOS[c.combo];
  const b = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: combo.body }));
  b.name = "Floor (black)";
  const a = new THREE.Mesh(accent, new THREE.MeshStandardMaterial({ color: combo.accent }));
  a.name = `Rim, ring and lettering (${combo.accentName})`;
  const g = new THREE.Group();
  g.name = "ZenkiLab Key Tag";
  g.add(b, a);
  return g;
}
