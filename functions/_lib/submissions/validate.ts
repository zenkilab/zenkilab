import { filamentColors } from '../../../src/lib/automotive-config';
function canonical(v: unknown): string { return JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x); }
import JSZip from 'jszip';
export function validateAutomotiveStl(bytes: Uint8Array, expectedVolume: number) {
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const edges=new Map<string,{count:number;direction:number}>();
    let volume=0;
    for(let face=0;face<view.getUint32(80,true);face++){
        const vertices=[0,1,2].map(v=>[0,1,2].map(axis=>view.getFloat32(84+face*50+12+v*12+axis*4,true)));
        const keys=vertices.map(v=>v.map(n=>n.toFixed(5)).join(','));
        if(new Set(keys).size<3)throw Error('Degenerate STL triangle');
        const [a,b,c]=vertices,ab=b.map((x,i)=>x-a[i]),ac=c.map((x,i)=>x-a[i]);
        const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
        if(cross.reduce((s,v)=>s+v*v,0)<1e-16)throw Error('Degenerate STL triangle');
        volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
        for(let i=0;i<3;i++){
            const key=[keys[i],keys[(i+1)%3]].sort().join('|'),prior=edges.get(key)||{count:0,direction:0};
            prior.count++;prior.direction+=keys[i]<keys[(i+1)%3]?1:-1;edges.set(key,prior);
        }
    }
    if([...edges.values()].some(v=>v.count!==2||v.direction!==0))throw Error('STL failed closed-solid topology check');
    if(volume<=0||!Number.isFinite(expectedVolume)||Math.abs(volume-expectedVolume)>.02)throw Error('STL/3MF volume mismatch');
    return {stlClosedEdgeScreen:true,stlVolumeMm3:volume,stl3mfVolumeConsistent:true,stlIndependentlyMatched:false};
}
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
        const original = (e as unknown as {unsafeOriginalName?: string}).unsafeOriginalName || name;
        if (original.includes('..') || original.includes('\\') || name.includes('..') || name.startsWith('/') || !(/^(3D\/.*\.model|Metadata\/[\w.-]+\.(json|xml|config)|_rels\/\.rels|3D\/_rels\/[\w.-]+\.rels|\[Content_Types\]\.xml|Metadata\/.*\.(png|jpg))$/i.test(name)))
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
    if (!/\bunit="millimeter"/.test(xml)) throw Error('Model units must be millimeters');
    let triangles = 0, boundaryEdges = 0, nonManifoldEdges = 0, windingErrors = 0, degenerateTriangles = 0, volume = 0;
    for (const mesh of xml.matchAll(/<mesh>([\s\S]*?)<\/mesh>/g)) {
        const vs = [...mesh[1].matchAll(/<vertex\s+[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*z="([^"]+)"/g)].map(m => m.slice(1).map(Number));
        const edges = new Map<string, number>();
        const directions = new Map<string, number>();
        let meshVolume = 0;
        for (const t of mesh[1].matchAll(/<triangle\s+[^>]*v1="(\d+)"[^>]*v2="(\d+)"[^>]*v3="(\d+)"/g)) {
            const ids = t.slice(1).map(Number);
            if (ids.some(i => i >= vs.length) || new Set(ids).size < 3)
                throw Error('Invalid triangle indices');
            const keys = ids.map(i => vs[i].map(x => x.toFixed(5)).join(','));
            const [a,b,c] = ids.map(i=>vs[i]);
            const ab=b.map((x,i)=>x-a[i]), ac=c.map((x,i)=>x-a[i]);
            const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
            if(new Set(keys).size<3 || cross.reduce((s,v)=>s+v*v,0)<1e-16)degenerateTriangles++;
            meshVolume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
            for (let i = 0; i < 3; i++) {
                const key = [keys[i], keys[(i + 1) % 3]].sort().join('|');
                edges.set(key, (edges.get(key) || 0) + 1);
                directions.set(key,(directions.get(key)||0)+(keys[i]<keys[(i+1)%3]?1:-1));
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
        for(const [key,count] of edges)if(count===2&&directions.get(key)!==0)windingErrors++;
        if(config&&meshVolume<=0)throw Error('Nonpositive automotive material volume');
        volume+=meshVolume;
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
        if(boundaryEdges || nonManifoldEdges || windingErrors || degenerateTriangles)throw Error('Automotive CAD failed closed-solid topology checks; regenerate or request design review');
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
    return { origin: 'client-generated', structuralValidation: true, triangles, vertices: vertices.length, boundaryEdges, nonManifoldEdges, windingErrors, degenerateTriangles, volumeMm3:volume, watertightEdgeScreen: boundaryEdges === 0 && nonManifoldEdges === 0, independentlyRegenerated: false, serverGeometryVerified: false, status: 'manufacturing-review-required', limitations: 'Archive, coordinate, topology-edge, winding, volume and configuration checks; not independent geometry regeneration, intersection or full solid validation' };
}
