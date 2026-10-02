import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import polygonClipping, { type Geom } from "polygon-clipping";
import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import { COMBOS, TAG, plateHeight, sanitizePhone, type DogTagConfig } from "@/lib/dogtag";
import { qrMatrix } from "@/lib/qr";

// All units are millimetres. Back face at z=0, front face at z=FLOOR. Two closed belt loops hang off the
// back (toward -z), one per end, so the plate itself stays a solid slab with flush inlays on both faces.
// The whole thing is bent around a shallow cylinder as a final step.
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);

const { W, FLOOR: F, INLAY: I, CORNER_R, QR_SIZE, BEND_RADIUS, LOOP_L, STRAP, CLEAR_W, CLEAR_T, R_IN, R_OUT, R_END, FILLET } = TAG;

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

/** Insert extra collinear points along any edge longer than maxLen, so the later bend transform has
 * enough vertices to follow the curve instead of faceting across one long straight chord. */
function subdivide(pts: V[], maxLen: number): V[] {
  const out: V[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    out.push(a);
    const segs = Math.ceil(a.distanceTo(b) / maxLen);
    for (let s = 1; s < segs; s++) out.push(a.clone().lerp(b, s / segs));
  }
  return out;
}

const clean = (pts: V[]) => {
  const out: V[] = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceTo(p) > 1e-3) out.push(p);
  if (out.length > 1 && out[0].distanceTo(out[out.length - 1]) < 1e-3) out.pop();
  return out;
};

/** A flat shape: one outer boundary and its holes, in mm. */
type Region = { outer: V[]; holes: V[][] };

const ringOf = (pts: V[]): [number, number][] => {
  const r = pts.map((p): [number, number] => [p.x, p.y]);
  r.push(r[0]);
  return r;
};
const geom = (pts: V[]): Geom => [ringOf(pts)];
const regions = (g: ReturnType<typeof polygonClipping.union>): Region[] =>
  g.map(([outer, ...holes]) => ({ outer: outer.slice(0, -1).map(([x, y]) => v(x, y)), holes: holes.map((h) => h.slice(0, -1).map(([x, y]) => v(x, y))) }));

const extrude = (shape: THREE.Shape, depth: number, z: number) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, z);
  return g;
};

const shapeOf = (r: Region, extraHoles: V[][] = []) => {
  const s = new THREE.Shape(r.outer);
  s.holes = [...r.holes, ...extraHoles].map((h) => new THREE.Path(h));
  return s;
};

/** Splits a region into vertical strips no wider than stripW. ExtrudeGeometry triangulates a shape's
 * interior by ear-clipping its boundary only, so one big flat rectangle stays just two giant triangles
 * no matter how many points its edges have, and bend() then folds those visibly instead of curving.
 * Cutting it into many narrow strips first gives the curve that many hinge points to actually bend at. */
function stripRegions(r: Region, y0: number, y1: number, stripW: number): Region[] {
  const xs = r.outer.map((p) => p.x);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const out: Region[] = [];
  for (let sx = x0; sx < x1 - 1e-6; sx += stripW) {
    const band = geom(clean(roundedRect(sx, y0 - 1, Math.min(sx + stripW, x1), y1 + 1, [0, 0, 0, 0])));
    for (const piece of regions(polygonClipping.intersection(geom(r.outer), band))) {
      if (!r.holes.length) { out.push(piece); continue; }
      const cut = regions(polygonClipping.difference(geom(piece.outer), ...r.holes.map((h) => geom(h))));
      out.push(...cut);
    }
  }
  return out;
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

/** Bends a whole geometry around a cylinder of the given radius, axis along Y: x=0 stays put, the ends
 * curl toward -z (toward the collar) as |x| grows. z is measured as the vertex's original distance out
 * from the back face, so a thicker part of the plate keeps a very slightly larger effective radius. */
function bend(g: THREE.BufferGeometry, radius: number) {
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const theta = x / radius;
    const r = radius + z;
    pos.setXYZ(i, r * Math.sin(theta), y, r * Math.cos(theta) - radius);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** One ring slice of a belt loop: the Y-Z ring (outer block, rounded belt opening cut out) extruded along X
 * from xa to xb, hanging `depth` below the back face. Its top overlaps the plate by 0.2 mm so the two fuse.
 * The opening is rounded on every corner (R_IN) so a tightened collar and a thick print don't crack from a
 * sharp internal 90 degrees. Shape coordinates are (a, b) = (-z, y); rotateY(90deg) maps that to z = -a,
 * y = b, with the extrusion on +x. */
function loopSlice(xa: number, xb: number, H: number, openW: number, openT: number, depth: number) {
  const shape = new THREE.Shape(roundedRect(-0.2, -H / 2, depth, H / 2, [0, R_OUT, R_OUT, 0]));
  shape.holes = [new THREE.Path(roundedRect(0, -openW / 2, openT, openW / 2, [R_IN, R_IN, R_IN, R_IN]))];
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.abs(xb - xa), bevelEnabled: false, curveSegments: 24 });
  g.rotateY(PI / 2);
  g.translate(Math.min(xa, xb), 0, 0);
  return flat(g);
}

/** One belt loop at the +x end (s = 1) or -x end (s = -1): a full-depth ring, a rounded tip (stacked thin
 * slices following a quarter circle, so the loop curls into the plate end instead of ending in a square
 * step), and on each post a concave fillet blending into the plate's back. The fillets sit on the posts
 * only, beside the belt, never across its path. */
function beltLoop(s: 1 | -1, H: number, openW: number, openT: number) {
  const D = openT + STRAP;
  const xin = s * (W / 2 - LOOP_L), c = s * (W / 2 - R_END);
  const parts = [loopSlice(xin, c, H, openW, openT, D)];
  const N = 8;
  for (let k = 0; k < N; k++) {
    const e = (R_END * (k + 1)) / N; // distance of this slice's outer edge past where the rounding starts
    const depth = D - R_END + Math.sqrt(R_END * R_END - e * e);
    parts.push(loopSlice(c + (s * R_END * k) / N, c + (s * R_END * (k + 1)) / N, H, openW, openT, depth));
  }
  // Fillet profile in (x, z): concave quarter between the loop's inner face and the plate's back, with a 0.2 mm
  // overlap into both. Extruded across one post, then rotated so shape-y becomes world z and depth runs along -y.
  const r = FILLET, wi = openW / 2, postW = H / 2 - wi;
  const q = arc(0, -r, r, PI / 2, 0).map((p) => v(xin - s * r + s * p.x, p.y)); // concave arc, mirrored for s = -1
  const pts = [v(xin + s * 0.2, 0.2), v(xin - s * r, 0.2), ...q, v(xin + s * 0.2, -r)];
  if (s < 0) pts.reverse();
  for (const y of [H / 2, -wi]) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: postW, bevelEnabled: false });
    g.rotateX(PI / 2).translate(0, y, 0);
    parts.push(flat(g));
  }
  return parts;
}

type Glyph = { outer: V[]; counters: V[][] };

/** Letter outlines fitted into a w x h box centred at (cx, cy). Mirrored on X when `mirror` (viewed from
 * behind, same reasoning as the Key Tag's back marketing stamp). */
function textOutlines(str: string, cx: number, cy: number, w: number, h: number, mirror: boolean): Glyph[] {
  if (!str.trim()) return [];
  const raw = font.generateShapes(str, 10).map((sh) => {
    const p = sh.extractPoints(10);
    return { outer: p.shape, counters: p.holes };
  });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const g of raw) for (const p of g.outer) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  const s = Math.min(w / (x1 - x0), h / (y1 - y0));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const flipX = mirror ? -1 : 1;
  const map = (p: THREE.Vector2) => new THREE.Vector2(cx + flipX * (p.x - mx) * s, cy + (p.y - my) * s);
  return raw.map((g) => ({ outer: g.outer.map(map), counters: g.counters.map((c) => c.map(map)) }));
}

/** One square polygon per dark QR module, fitted into a `size` x `size` box centred at (cx, cy).
 * QR modules have no interior counters, so this is simpler than text: no holes to punch inside a glyph. */
function qrOutlines(text: string, cx: number, cy: number, size: number): Glyph[] {
  const grid = qrMatrix(text);
  const n = grid.length;
  const cell = size / n;
  const out: Glyph[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!grid[row][col]) continue;
      const x0 = cx - size / 2 + col * cell;
      const y0 = cy + size / 2 - (row + 1) * cell; // row 0 is the top
      out.push({ outer: [v(x0, y0), v(x0 + cell, y0), v(x0 + cell, y0 + cell), v(x0, y0 + cell)], counters: [] });
    }
  }
  return out;
}

/** Punch every glyph/module's outer boundary as a hole in a region, unioning adjacent shapes first so
 * the mesh isn't hundreds of separate tiny holes for a dense QR code. */
function withHolesPunched(base: Region, glyphs: Glyph[]) {
  if (!glyphs.length) return base;
  const geoms = glyphs.map((g) => geom(g.outer));
  const merged = polygonClipping.union(geoms[0], ...geoms.slice(1));
  const holeRegions = regions(merged);
  const allHoles = [...base.holes.map((h) => geom(h)), ...holeRegions.map((r) => geom(r.outer))];
  return regions(polygonClipping.difference(geom(base.outer), ...allHoles))[0];
}

export function buildDogTag(c: DogTagConfig) {
  const H = plateHeight(c.collarWidthMm);
  const outline = subdivide(clean(roundedRect(-W / 2, -H / 2, W / 2, H / 2, [CORNER_R, CORNER_R, CORNER_R, CORNER_R])), 4);
  const plate: Region = { outer: outline, holes: [] };

  const margin = 3; // gap between the QR/text content and the plate's own edges
  const phone = sanitizePhone(c.phone);

  // Everything readable lives on the FRONT: the back sits against the collar once worn, so anything
  // printed there would be invisible to whoever finds the dog. QR on the left; name (if any), phone,
  // and a small "tap or scan" hint stacked on the right. The back stays a plain, unmarked plate.
  const qrCx = -W / 2 + margin + QR_SIZE / 2;
  const qrGlyphs = qrOutlines(`tel:${phone}`, qrCx, 0, QR_SIZE);
  const labelX0 = qrCx + QR_SIZE / 2 + 3;
  const textCx = (labelX0 + (W / 2 - margin)) / 2;
  const textW = W / 2 - margin - labelX0;
  const contentH = H - 2 * margin;
  // The font has no "+" glyph (same restriction as the Key Tag's own text sanitizer), so the engraved
  // text drops it; the QR/NFC data above keeps the full "+94..." form.
  const phoneText = phone.replace(/^\+/, "");
  const hasName = c.showText && !!c.petName.trim();

  let rightGlyphs: Glyph[];
  if (!c.showText) {
    rightGlyphs = textOutlines("TAP OR SCAN", textCx, 0, textW, Math.min(7, contentH * 0.3), false);
  } else if (hasName) {
    rightGlyphs = [
      ...textOutlines(c.petName, textCx, contentH * 0.28, textW, contentH * 0.26, false),
      ...textOutlines(phoneText, textCx, -contentH * 0.06, textW, contentH * 0.3, false),
      ...textOutlines("TAP OR SCAN", textCx, -contentH * 0.36, textW, Math.min(5, contentH * 0.14), false),
    ];
  } else {
    rightGlyphs = [
      ...textOutlines(phoneText, textCx, contentH * 0.12, textW, contentH * 0.34, false),
      ...textOutlines("TAP OR SCAN", textCx, -contentH * 0.26, textW, Math.min(6, contentH * 0.16), false),
    ];
  }
  const frontGlyphs = [...qrGlyphs, ...rightGlyphs];
  const backGlyphs: Glyph[] = [];

  const bodyParts: THREE.BufferGeometry[] = [];
  const accent: THREE.BufferGeometry[] = [];

  const STRIP_W = 4; // matches subdivide()'s edge spacing

  // Back inlay band: z 0..I
  const backFloor = withHolesPunched(plate, backGlyphs);
  for (const piece of stripRegions(backFloor, -H / 2, H / 2, STRIP_W)) bodyParts.push(flat(extrude(shapeOf(piece), I, 0)));
  for (const g of backGlyphs) {
    for (const counter of g.counters) bodyParts.push(flat(extrude(new THREE.Shape(counter), I, 0)));
    const letter = new THREE.Shape(g.outer);
    letter.holes = g.counters.map((cn) => new THREE.Path(cn));
    accent.push(extrude(letter, I, 0));
  }

  // Solid slab from the back inlay up to the front inlay, minus the NFC pocket.
  for (const piece of stripRegions(plate, -H / 2, H / 2, STRIP_W)) bodyParts.push(flat(extrude(shapeOf(piece), F - 2 * I, I)));
  const { w: pw, h: ph, t: pt, zc } = TAG.POCKET;
  bodyParts.push(voidBox(pw, ph, pt, 0, 0, zc));
  const openW = c.collarWidthMm + CLEAR_W, openT = c.collarThicknessMm + CLEAR_T;
  bodyParts.push(...beltLoop(1, H, openW, openT), ...beltLoop(-1, H, openW, openT));

  // Front inlay band: z F-I..F
  const frontFloor = withHolesPunched(plate, frontGlyphs);
  for (const piece of stripRegions(frontFloor, -H / 2, H / 2, STRIP_W)) bodyParts.push(flat(extrude(shapeOf(piece), I, F - I)));
  for (const g of frontGlyphs) {
    for (const counter of g.counters) bodyParts.push(flat(extrude(new THREE.Shape(counter), I, F - I)));
    const letter = new THREE.Shape(g.outer);
    letter.holes = g.counters.map((cn) => new THREE.Path(cn));
    accent.push(extrude(letter, I, F - I));
  }

  const body = bend(mergeGeometries(bodyParts, false)!, BEND_RADIUS);
  const merged = bend(mergeGeometries(accent.map(flat), false)!, BEND_RADIUS);
  bodyParts.forEach((g) => g.dispose());
  accent.forEach((g) => g.dispose());
  return { body, accent: merged };
}

/** One mesh per color so AMS slots map one to one. Used by the 3MF export. Oriented for printing, not
 * for the on-screen preview (which uses buildDogTag directly). */
export function buildDogTagPrintGroup(c: DogTagConfig) {
  const { body, accent } = buildDogTag(c);
  // Print front face down: flip about X (z -> -z), then lift so the front's centre line sits on the bed.
  for (const g of [body, accent]) g.rotateX(PI).translate(0, 0, F);
  const combo = COMBOS[c.combo];
  const b = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ color: combo.body }));
  b.name = "Plate (black)";
  const a = new THREE.Mesh(accent, new THREE.MeshStandardMaterial({ color: combo.accent }));
  a.name = `QR, label and text (${combo.accentName})`;
  const g = new THREE.Group();
  g.name = "ZenkiLab Dog Tag";
  g.add(b, a);
  return g;
}
