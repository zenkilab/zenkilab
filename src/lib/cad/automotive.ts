import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { exportTo3MF } from "three-3mf-exporter";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import JSZip from "jszip";
import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import emblem from "./mercedes-reference.json";
import { filamentColors, registrationLayout, type Border, type Shape } from "@/lib/automotive";
export interface AutomotiveConfig {
    brand: string;
    registration: string;
    shape: Shape;
    border: Border;
    body: string;
    accent: string;
    branding: boolean;
    notes?: string;
    customBrand?: string;
}
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);
function text(value: string, w: number, h: number, cx = 0, back = false) { const shapes = font.generateShapes(value, 10); const g = new THREE.ExtrudeGeometry(shapes, { depth: .48, bevelEnabled: false, curveSegments: 20 }); g.computeBoundingBox(); const b = g.boundingBox!, k = Math.min(w / (b.max.x - b.min.x), h / (b.max.y - b.min.y)); g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0); g.scale(back ? -k : k, k, 1); if (back) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(p, i), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
        p.setXYZ(i, c.x, c.y, c.z);
        p.setXYZ(i + 2, a.x, a.y, a.z);
    }
    g.computeVertexNormals();
} g.translate(cx, 0, back ? 0 : 3.2); return g; }
function outline(radius: number, inset = 0) { const w = 58 - 2 * inset, h = 28 - 2 * inset, r = radius - inset; const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, 1.5 * Math.PI, false); return s; }
export async function generateAutomotive(c: AutomotiveConfig) {
    if (c.brand !== "mercedes")
        return null;
    if (!registrationLayout(c.registration).valid)
        throw Error('Invalid registration');
    const r = c.shape === 'capsule' ? 14 : 5;
    const shape = outline(r);
    const hole = new THREE.Path();
    hole.absarc(-23.5, 0, 2.25, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const body: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, { depth: 3.2, bevelEnabled: false, curveSegments: 96 });
    const data = Uint8Array.from(atob(emblem.stl), v => v.charCodeAt(0));
    const logo = new STLLoader().parse(data.buffer);
    const accents = [logo, text(c.registration, 25, 6, 10.5)];
    if (c.branding) { /* Flush back inlay uses the proven general keytag construction: lower region with glyph holes and white counters, continuous upper body. */
        const glyphs = font.generateShapes('ZenkiLab.com', 10);
        const probe = new THREE.ShapeGeometry(glyphs);
        probe.computeBoundingBox();
        const b = probe.boundingBox!, k = Math.min(27 / (b.max.x - b.min.x), 3.5 / (b.max.y - b.min.y));
        const paths = glyphs.map(s => s.extractPoints(20));
        const base = outline(r);
        base.holes.push(hole);
        const counters: THREE.Shape[] = [];
        for (const p of paths) {
            base.holes.push(new THREE.Path(p.shape.map(v => new THREE.Vector2(-(v.x - (b.min.x + b.max.x) / 2) * k, (v.y - (b.min.y + b.max.y) / 2) * k))));
            for (const h of p.holes)
                counters.push(new THREE.Shape(h.map(v => new THREE.Vector2(-(v.x - (b.min.x + b.max.x) / 2) * k, (v.y - (b.min.y + b.max.y) / 2) * k))));
        }
        const low = new THREE.ExtrudeGeometry([base, ...counters], { depth: .48, bevelEnabled: false, curveSegments: 96 });
        const upper = new THREE.ExtrudeGeometry(shape, { depth: 2.72, bevelEnabled: false, curveSegments: 96 });
        upper.translate(0, 0, .48);
        body.copy(mergeGeometries([low, upper]));
        accents.push(text('ZenkiLab.com', 27, 3.5, 0, true));
    }
    if (c.border !== 'none') {
        const width = c.border === 'bold' ? .96 : .48;
        for (const inset of c.border === 'double' ? [.8, 1.8] : [.8]) {
            const ring = outline(r, inset);
            ring.holes.push(new THREE.Path(outline(r, inset + width).getPoints(96)));
            const g = new THREE.ExtrudeGeometry(ring, { depth: .48, bevelEnabled: false, curveSegments: 96 });
            g.translate(0, 0, 3.2);
            accents.push(g);
        }
    }
    const group = new THREE.Group();
    for (const [g, id, name] of [[body, c.body, 'Body'], [mergeGeometries(accents.map(g => { const flat = g.index ? g.toNonIndexed() : g; flat.deleteAttribute("uv"); return flat; })), c.accent, 'Emblem registration border branding']] as const) {
        const color = filamentColors.find(x => x.id === id);
        if (!color)
            throw Error('Unknown color');
        const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: color.hex }));
        mesh.name = name;
        group.add(mesh);
    }
    const three = await exportTo3MF(group, { filament: 'Generic PETG' });
    const zip = await JSZip.loadAsync(await three.arrayBuffer());
    zip.file('Metadata/zenki-config.json', JSON.stringify(c));
    const model = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'model/3mf' });
    const stl = new STLExporter().parse(group, { binary: true });
    return { model, stl: new Blob([new Uint8Array(stl.buffer as ArrayBuffer)], { type: 'model/stl' }), status: 'client-generated; manufacturing review required', group };
}
