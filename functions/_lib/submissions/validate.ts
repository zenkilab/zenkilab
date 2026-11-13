import { filamentColors } from '../../../src/lib/automotive';
function canonical(v: unknown): string { return JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x); }
import JSZip from 'jszip';
export async function validateModel(bytes: Uint8Array, config?: unknown) {
    const zip = await JSZip.loadAsync(bytes);
    let total = 0;
    const names = Object.keys(zip.files);
    if (names.length > 100)
        throw Error('Too many archive entries');
    for (const name of names) {
        const e = zip.files[name];
        if (e.dir)
            continue;
        if (name.includes('..') || name.startsWith('/') || !(/^(3D\/.*\.model|Metadata\/[\w.-]+\.(json|xml|config)|_rels\/\.rels|3D\/_rels\/[\w.-]+\.rels|\[Content_Types\]\.xml|Metadata\/.*\.(png|jpg))$/i.test(name)))
            throw Error('Unsupported archive entry');
        const size = (e as unknown as {
            _data: {
                uncompressedSize: number;
            };
        })._data.uncompressedSize;
        total += size;
        if (!Number.isFinite(size) || total > 24 * 1024 * 1024)
            throw Error('Expanded archive too large');
    }
    const file = zip.file('3D/3dmodel.model');
    if (!file)
        throw Error('Missing 3MF model');
    const xml = await file.async('string');
    if (/<!|<script|\b(?:href|src)="(?:https?:|\/\/|data:)/i.test(xml))
        throw Error('Unsafe model XML');
    const vertices = [...xml.matchAll(/<vertex\s+[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*z="([^"]+)"[^>]*\/?\s*>/g)].map(m => m.slice(1).map(Number));
    if (vertices.length < 4 || vertices.length > 300000 || vertices.some(v => v.some(x => !Number.isFinite(x) || Math.abs(x) > 2000)))
        throw Error('Invalid mesh coordinates');
    let triangles = 0, boundaryEdges = 0, nonManifoldEdges = 0;
    for (const mesh of xml.matchAll(/<mesh>([\s\S]*?)<\/mesh>/g)) {
        const vs = [...mesh[1].matchAll(/<vertex\s+[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*z="([^"]+)"/g)].map(m => m.slice(1).map(Number));
        const edges = new Map<string, number>();
        for (const t of mesh[1].matchAll(/<triangle\s+[^>]*v1="(\d+)"[^>]*v2="(\d+)"[^>]*v3="(\d+)"/g)) {
            const ids = t.slice(1).map(Number);
            if (ids.some(i => i >= vs.length) || new Set(ids).size < 3)
                throw Error('Invalid triangle indices');
            const keys = ids.map(i => vs[i].map(x => x.toFixed(5)).join(','));
            for (let i = 0; i < 3; i++) {
                const key = [keys[i], keys[(i + 1) % 3]].sort().join('|');
                edges.set(key, (edges.get(key) || 0) + 1);
            }
            triangles++;
            if (triangles > 500000)
                throw Error('Mesh too complex');
        }
        for (const count of edges.values()) {
            if (count === 1)
                boundaryEdges++;
            else if (count !== 2)
                nonManifoldEdges++;
        }
    }
    if (!triangles)
        throw Error('No triangles');
    if ((xml.match(/<vertex\b/g) || []).length !== vertices.length || (xml.match(/<triangle\b/g) || []).length !== triangles)
        throw Error('Unsupported mesh syntax');
    if (/<component[^>]+(?:path|href)=/i.test(xml))
        throw Error('External component references unsupported');
    const ids = [...xml.matchAll(/<object\s+id="(\d+)"/g)].map(m => m[1]);
    if (new Set(ids).size !== ids.length || [...xml.matchAll(/objectid="(\d+)"/g)].some(m => !ids.includes(m[1])))
        throw Error('Broken component references');
    if (config) {
        const c = config as {
            body: string;
            accent: string;
        };
        const project = zip.file('Metadata/project_settings.config');
        const mapping = zip.file('Metadata/model_settings.config');
        if (!project || !mapping)
            throw Error('Missing material assignment');
        const settings = JSON.parse(await project.async('string'));
        const expected = [c.body, c.accent].map(id => filamentColors.find(v => v.id === id)?.hex.toLowerCase());
        if (JSON.stringify(settings.filament_colour.map((v: string) => v.toLowerCase())) !== JSON.stringify(expected))
            throw Error('Material colors mismatch');
        const spans = [0, 1, 2].map(axis => { let lo = Infinity, hi = -Infinity; for (const v of vertices) {
            lo = Math.min(lo, v[axis]);
            hi = Math.max(hi, v[axis]);
        } return hi - lo; });
        if (spans.some((v, i) => Math.abs(v - [58, 28, 3.92][i]) > .03))
            throw Error('Automotive dimensions mismatch');
        if (!/value="2"/.test(await mapping.async('string')))
            throw Error('Missing second material assignment');
        const metadata = zip.file('Metadata/zenki-config.json');
        if (!metadata || canonical(JSON.parse(await metadata.async('string'))) !== canonical(config))
            throw Error('CAD configuration metadata mismatch');
    }
    return { origin: 'client-generated', structuralValidation: true, triangles, vertices: vertices.length, boundaryEdges, nonManifoldEdges, watertightEdgeScreen: boundaryEdges === 0 && nonManifoldEdges === 0, independentlyRegenerated: false, serverGeometryVerified: false, status: 'manufacturing-review-required', limitations: 'Archive, coordinate, topology-edge and configuration checks; not independent geometry regeneration, intersection or full solid validation' };
}
