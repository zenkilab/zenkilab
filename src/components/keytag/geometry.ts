import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import polygonClipping, { type Geom } from "polygon-clipping";
import fontData from "./spacegrotesk_bold.typeface.json";
import { COMBOS, CORNER_RADIUS, TAG, type Corner, type KeyTagConfig } from "@/lib/keytag";

// All units are millimetres. Front face is +Z, the tag lies flat.
// FRONT: a raised rim, one ring around the keyring hole and raised lettering stand TAG.EMBOSS
// above a recessed floor.
// BACK: completely flat. If the marketing line is kept it is a flush color inlay (no relief).
// Floor and accent are separate meshes so the printer can use two colors.
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);

const { W, H, FLOOR: F, EMBOSS: E, INLAY: I, RIM, HOLE_R } = TAG;
const BOSS = 1.3; // width of the single ring around the keyring hole on the capsule
const COLLAR = 1.3; // flat floor between the hole and the rim where the hole sits in a corner or an ear
const TEXT_W = W - 2 * (RIM + 2.6); // lettering runs the full length, inside the rim

type V = THREE.Vector2;
const v = (x: number, y: number) => new THREE.Vector2(x, y);
const PI = Math.PI;

/** Points along an arc from angle a0 to a1 (either direction), about 0.25 mm apart. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number): V[] {
  const n = Math.max(4, Math.ceil((Math.abs(a1 - a0) * r) / 0.25));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return v(cx + r * Math.cos(a), cy + r * Math.sin(a));
  });
}

/** Rounded rectangle, counter-clockwise, corner radii [top left, top right, bottom right, bottom left]. */
function roundedRect(x0: number, y0: number, x1: number, y1: number, [tl, tr, br, bl]: number[]): V[] {
  const corner = (cx: number, cy: number, r: number, a0: number, a1: number, px: number, py: number) => (r > 0 ? arc(cx, cy, r, a0, a1) : [v(px, py)]);
  return [
    ...corner(x0 + bl, y0 + bl, bl, PI, 1.5 * PI, x0, y0),
    ...corner(x1 - br, y0 + br, br, -PI / 2, 0, x1, y0),
    ...corner(x1 - tr, y1 - tr, tr, 0, PI / 2, x1, y1),
    ...corner(x0 + tl, y1 - tl, tl, PI / 2, PI, x0, y1),
  ];
}

const clean = (pts: V[]) => {
  const out: V[] = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p) > 1e-3) out.push(p);
  if (out.length > 1 && out[0].distanceTo(out[out.length - 1]) < 1e-3) out.pop();
  return out;
};

/** Counter-clockwise polygon moved inwards by d (mitred corners). Fine for offsets smaller than the tightest curve. */
function inset(poly: V[], d: number): V[] {
  const pts = clean(poly);
  const n = pts.length;
  return pts.map((p, i) => {
    const e0 = p.clone().sub(pts[(i + n - 1) % n]).normalize();
    const e1 = pts[(i + 1) % n].clone().sub(p).normalize();
    const n0 = v(-e0.y, e0.x);
    const n1 = v(-e1.y, e1.x);
    return p.clone().add(n0.add(n1).multiplyScalar(d / Math.max(1 + n0.dot(n1), 0.2)));
  });
}

/** A flat shape: one outer boundary and its holes, in mm. */
type Region = { outer: V[]; holes: V[][] };

const ringOf = (pts: V[]): [number, number][] => {
  const r = pts.map((p): [number, number] => [p.x, p.y]);
  r.push(r[0]);
  return r;
};
const geom = (pts: V[]): Geom => [ringOf(pts)];
const disc = (x: number, y: number, r: number) => clean(arc(x, y, r, 0, 2 * PI));
/** Boolean results back to plain regions */
const regions = (g: ReturnType<typeof polygonClipping.union>): Region[] =>
  g.map(([outer, ...holes]) => ({ outer: outer.slice(0, -1).map(([x, y]) => v(x, y)), holes: holes.map((h) => h.slice(0, -1).map(([x, y]) => v(x, y))) }));

type Design = {
  floor: Region; // black floor, with the keyring hole already cut out
  rim: Region[]; // raised rim, in the accent colour
  boss?: { x: number; y: number }; // separate ring around the hole (capsule only, elsewhere the rim is the ring)
  zone: { cx: number; cy: number; w: number; h: number }; // lettering box, centred on the plate
  pocket: { cx: number; cy: number };
};

// Capsule: hole at the left end, lettering to its right.
const capsuleHole = { x: -W / 2 + 7.5, y: 0 };
const capsuleL = capsuleHole.x + HOLE_R + BOSS + 2.4;
const capsuleR = W / 2 - RIM - 2.6;
const capsuleOutline = clean(roundedRect(-W / 2, -H / 2, W / 2, H / 2, [H / 2, H / 2, H / 2, H / 2]));

// Ring: a plain rounded plate with the keyring hole in a ring on its top left corner. The ring is in the
// rim colour and at the rim height, and its middle sits just inside the plate's top and left edges, so
// the hole cuts the plate's corner away and the rim wraps around the ring. The ring stands out of the
// plate by the rest of its width, all inside the 5 x 2.5 cm box.
const RING_R = HOLE_R + RIM; // outer radius of the ring: the hole plus one rim width
const RING_IN = 2; // the ring's centre is this far inside the plate's top and left edges: more than
// this and the ring reads as a plain hole, less and it barely touches the plate
const ringC = { x: -W / 2 + RING_R, y: H / 2 - RING_R };
const plate = { x0: ringC.x - RING_IN, y1: ringC.y + RING_IN };
const ring = (R: number): Design => {
  const P = clean(roundedRect(plate.x0, -H / 2, W / 2, plate.y1, [0, R, R, R]));
  const ringDisc = geom(disc(ringC.x, ringC.y, RING_R));
  const hole = geom(disc(ringC.x, ringC.y, HOLE_R));
  const band = polygonClipping.difference(geom(P), geom(inset(P, RIM)));
  const cx = (plate.x0 + W / 2) / 2;
  const cy = (-H / 2 + plate.y1) / 2;
  return {
    floor: regions(polygonClipping.difference(polygonClipping.union(geom(P), ringDisc), hole))[0],
    rim: regions(polygonClipping.difference(polygonClipping.union(band, ringDisc), hole)),
    zone: { cx, cy, w: W / 2 - plate.x0 - 2 * (RIM + 1.6), h: 9 },
    pocket: { cx, cy },
  };
};

const CAPSULE_DESIGN: Design = {
  floor: { outer: capsuleOutline, holes: [disc(capsuleHole.x, capsuleHole.y, HOLE_R)] },
  rim: [{ outer: capsuleOutline, holes: [inset(capsuleOutline, RIM)] }],
  boss: capsuleHole,
  zone: { cx: (capsuleL + capsuleR) / 2, cy: 0, w: capsuleR - capsuleL, h: 9 },
  pocket: { cx: 4.6, cy: 0 },
};

// One ring design per corner-roundness preset the customer can pick, built once at module load.
const RING_DESIGNS: Record<Corner, Design> = {
  sharp: ring(CORNER_RADIUS.sharp),
  soft: ring(CORNER_RADIUS.soft),
  round: ring(CORNER_RADIUS.round),
};

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

const shapeOf = (r: Region, extraHoles: V[][] = []) => {
  const s = new THREE.Shape(r.outer);
  s.holes = [...r.holes, ...extraHoles].map((h) => new THREE.Path(h));
  return s;
};

/** Flat ring of outer radius r around the keyring hole */
function annulus(x: number, y: number, r: number) {
  const s = new THREE.Shape();
  s.absarc(x, y, r, 0, Math.PI * 2, false);
  s.holes.push(circle(HOLE_R, x, y));
  return s;
}

/** The single ring around the keyring hole on the capsule, front face */
function boss(hole: { x: number; y: number }) {
  return extrude(annulus(hole.x, hole.y, HOLE_R + BOSS), E, F);
}

/** Raised lettering fitted into a w x h box (mm) centred at (cx, cy), front face. */
function frontText(str: string, cx: number, cy: number, w: number, h: number) {
  if (!str.trim()) return null;
  const g = new TextGeometry(str, { font, size: 10, depth: E, curveSegments: 6, bevelEnabled: false });
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  // Long names are squeezed sideways (down to 82%) before the letters are made shorter.
  const bw = b.max.x - b.min.x, bh = b.max.y - b.min.y;
  const sy = Math.min(h / bh, w / bw / 0.82);
  g.scale(Math.min(sy, w / bw), sy, 1);
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
function voidBox(w: number, h: number, t: number, x: number, y: number, z: number) {
  const b = new THREE.BoxGeometry(w, h, t);
  const idx = b.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = b.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  b.translate(x, y, z);
  return b.toNonIndexed();
}

const flat = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g);

/** Floor (black) and rim, ring and lettering (accent). Model z: back face at 0, front rim and lettering up to F + E. */
export function buildKeyTag(c: KeyTagConfig) {
  const bodyParts: THREE.BufferGeometry[] = [];
  const accent: THREE.BufferGeometry[] = [];
  const d = c.style === "capsule" ? CAPSULE_DESIGN : RING_DESIGNS[c.corner];
  const { zone, pocket } = d;

  const floorShape = (holes: V[][] = []) => shapeOf(d.floor, holes);

  if (c.branding) {
    // Flush inlay on the back: the marketing line replaces the bottom INLAY mm of the floor
    const glyphs = backOutlines("ZenkiLab.com", zone.cx, zone.cy, zone.w, 6);
    const bottom = floorShape(glyphs.map((g) => g.outer));
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
    const { w, h, t, zc } = TAG.POCKET;
    bodyParts.push(voidBox(w, h, t, pocket.cx, pocket.cy, zc));
  }

  for (const r of d.rim) accent.push(extrude(shapeOf(r), E, F));
  if (d.boss) accent.push(boss(d.boss));
  const t = frontText(c.text, zone.cx, zone.cy, zone.w, zone.h);
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
