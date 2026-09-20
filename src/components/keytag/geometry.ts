import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import fontData from "./spacegrotesk_bold.typeface.json";
import { COMBOS, TAG, type KeyTagConfig } from "@/lib/keytag";

// All units are millimetres. Front face is +Z, the tag lies flat.
// Capsule with a raised rim, raised lettering and rings on both faces. Everything inside the
// rim is the recessed floor (debossed by TAG.EMBOSS). Floor and rim are separate meshes so the
// printer can use two colors: black floor, accent rim and lettering.
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);

const { W, H, FLOOR: F, EMBOSS: E, RIM, HOLE_R, HOLE_X } = TAG;

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

/**
 * Put a symmetric shape's extrusion on the front (+Z, starting at the floor) or back (-Z) face.
 * No mirroring: rings and the rim sit at the same X on both faces. Only lettering is mirrored (see text()).
 */
const onFace = (g: THREE.BufferGeometry, side: 1 | -1) => {
  g.translate(0, 0, side === 1 ? F : -E);
  return g;
};

function rimBand(side: 1 | -1) {
  const outer = capsule(0);
  outer.holes.push(new THREE.Path(capsule(RIM).getPoints(64).reverse()));
  return onFace(new THREE.ExtrudeGeometry(outer, { depth: E, bevelEnabled: false, curveSegments: 32 }), side);
}

function ringAt(rIn: number, rOut: number, side: 1 | -1) {
  const s = new THREE.Shape();
  s.absarc(HOLE_X, 0, rOut, 0, Math.PI * 2, false);
  s.holes.push(circle(rIn, HOLE_X, 0));
  return onFace(new THREE.ExtrudeGeometry(s, { depth: E, bevelEnabled: false, curveSegments: 40 }), side);
}

/** Lettering fitted into a w x h box (mm) centred at (cx, cy). Raised by E on the chosen face. */
function text(str: string, cx: number, cy: number, w: number, h: number, side: 1 | -1) {
  if (!str.trim()) return null;
  const g = new TextGeometry(str, { font, size: 10, depth: E, curveSegments: 6, bevelEnabled: false });
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, 0);
  const s = Math.min(w / (b.max.x - b.min.x), h / (b.max.y - b.min.y));
  g.scale(s, s, 1);
  if (side === -1) g.rotateY(Math.PI);
  g.translate(cx, cy, side === 1 ? F : 0);
  return g;
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

// Lettering zone: right of the keyring rings, inside the rim
const ZONE_L = HOLE_X + HOLE_R + 2.9 + 2.2; // past the outer ring, with a clear gap
const ZONE_R = W / 2 - RIM - 2.6;
const ZONE = { cx: (ZONE_L + ZONE_R) / 2, w: ZONE_R - ZONE_L, h: 9 };

/** Floor (black) and rim, rings and lettering (accent). forPrint lifts the tag so the back emboss sits on the bed at z = 0. */
export function buildKeyTag(c: KeyTagConfig, forPrint = false) {
  // Floor with the keyring hole cut through
  const floorShape = capsule(0);
  floorShape.holes.push(circle(HOLE_R, HOLE_X, 0));
  let body: THREE.BufferGeometry = new THREE.ExtrudeGeometry(floorShape, { depth: F, bevelEnabled: false, curveSegments: 32 });
  if (c.rfid) {
    // Sealed pocket for a 20 x 10 mm wet inlay, in the middle of the floor
    const { w, h, t, cx } = TAG.POCKET;
    body = mergeGeometries([body.index ? body.toNonIndexed() : body, voidBox(w, h, t, cx, F / 2)], false);
  }

  const accent: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry | null) => g && accent.push(g);
  for (const side of [1, -1] as const) {
    push(rimBand(side));
    push(ringAt(HOLE_R, HOLE_R + 1.3, side)); // boss around the hole
    push(ringAt(HOLE_R + 2.3, HOLE_R + 2.9, side)); // thin outer ring
  }
  push(text(c.text, ZONE.cx, 0, ZONE.w, ZONE.h, 1));
  if (c.branding) push(text("ZenkiLab.com", ZONE.cx, 0, ZONE.w, 6, -1));

  const merged = mergeGeometries(accent.map((g) => (g.index ? g.toNonIndexed() : g)), false);
  accent.forEach((g) => g.dispose());
  if (forPrint) {
    body.translate(0, 0, E);
    merged.translate(0, 0, E);
  }
  return { body, accent: merged };
}

/** One mesh per color so AMS slots map one to one. Used by the 3MF export. */
export function buildPrintGroup(c: KeyTagConfig) {
  const { body, accent } = buildKeyTag(c, true);
  const combo = COMBOS[c.combo];
  const b = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: combo.body }));
  b.name = "Floor (black)";
  const a = new THREE.Mesh(accent, new THREE.MeshStandardMaterial({ color: combo.accent }));
  a.name = `Rim and lettering (${combo.accentName})`;
  const g = new THREE.Group();
  g.name = "ZenkiLab Key Tag";
  g.add(b, a);
  return g;
}
