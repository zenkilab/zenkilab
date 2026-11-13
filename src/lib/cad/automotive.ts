import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { exportTo3MF } from "three-3mf-exporter";
import type { Manifold, CrossSection, Vec2 } from "manifold-3d";
import { solidKernel } from "./solid-kernel";
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
function outline(radius: number, inset = 0) { const w = 58 - 2 * inset, h = 28 - 2 * inset, r = radius - inset; const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, 1.5 * Math.PI, false); return s; }
/** True solid construction; concatenating closed layers leaves internal faces. */
export async function generateAutomotive(c: AutomotiveConfig) {
    if (c.brand !== "mercedes") return null;
    if (!registrationLayout(c.registration).valid) throw Error('Invalid registration');
    const kernel = await solidKernel();
    const owned: {delete(): void}[] = [];
    const own = <T extends {delete(): void}>(v: T): T => { owned.push(v); return v; };
    const section = (path: THREE.Path) => own(new kernel.CrossSection(path.getPoints(96).map(v => [v.x,v.y] as Vec2), 'EvenOdd'));
    const extrude = (cs: CrossSection, h: number, z = 0) => own(own(cs.extrude(h)).translate([0,0,z]));
    function lettering(value: string, w: number, h: number, cx = 0, back = false) {
        const paths = font.generateShapes(value,10).map(s => s.extractPoints(20));
        const points = paths.flatMap(p => p.shape);
        const xs = points.map(v=>v.x), ys=points.map(v=>v.y);
        const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
        const k=Math.min(w/(x1-x0),h/(y1-y0));
        const contours=paths.flatMap(p=>[p.shape,...p.holes]).map(r=>r.map(v=>[(v.x-(x0+x1)/2)*k*(back?-1:1)+cx,(v.y-(y0+y1)/2)*k] as Vec2));
        return own(own(new kernel.CrossSection(contours,'NonZero')).simplify(.001));
    }
    function geometry(solid: Manifold) {
        if (solid.status() !== 'NoError' || solid.volume() <= 0) throw Error('Solid construction failed');
        const m=solid.getMesh();
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(m.vertProperties),3));
        g.setIndex(new THREE.BufferAttribute(new Uint32Array(m.triVerts),1));
        g.computeVertexNormals();
        return g;
    }
    try {
        const radius=c.shape==='capsule'?14:5;
        const outer=section(outline(radius));
        const circle=own(kernel.CrossSection.circle(2.25,384));
        const hole=own(circle.translate([-23.5,0]));
        const floor=own(outer.subtract(hole));
        const blank=extrude(floor,3.2);
        // Keep the approved sculpted STL, including the crowned ring and star arms.
        const data=Uint8Array.from(atob(emblem.stl),v=>v.charCodeAt(0));
        const reference=new STLLoader().parse(data.buffer);
        const positions=reference.getAttribute('position').array;
        const input=new kernel.Mesh({numProp:3,vertProperties:new Float32Array(positions),triVerts:Uint32Array.from({length:positions.length/3},(_,i)=>i)});
        input.merge();
        const importedLogo=own(new kernel.Manifold(input));
        let baseZ=Infinity;for(let i=2;i<positions.length;i+=3)baseZ=Math.min(baseZ,positions[i]);
        // STL stores 3.2 as Float32 3.2000000477. Snap that base plane to the
        // exact body plane before Boolean union, avoiding a microscopic gap.
        const logo=own(importedLogo.translate([0,0,3.2-baseZ]));
        reference.dispose();
        if(logo.status()!=='NoError')throw Error('Approved emblem mesh failed solid import');
        const registration=extrude(lettering(c.registration,25,6,10.5),.48,3.2);
        const accents: Manifold[]=[logo,registration];
        let body=blank;
        if(c.branding){
            const branding=extrude(lettering('ZenkiLab.com',27,3.5,0,true),.48);
            body=own(blank.subtract(branding));
            accents.push(branding);
        }
        if(c.border!=='none'){
            const width=c.border==='bold'?.96:.48;
            for(const inset of c.border==='double'?[.8,1.8]:[.8]){
                const edge=section(outline(radius,inset));
                const inside=section(outline(radius,inset+width));
                accents.push(extrude(own(edge.subtract(inside)),.48,3.2));
            }
        }
        // Remove coincident internal faces. Simplify at 0.1 micron to avoid
        // Float32/5-decimal 3MF serialization collapsing Boolean slivers.
        body=own(body.simplify(.0001));
        const accent=own(own(kernel.Manifold.union(accents)).simplify(.0001));
        const complete=own(own(body.add(accent)).simplify(.0001));
        const overlap=own(body.intersect(accent)).volume();
        if(overlap>1e-5 || Math.abs(complete.volume()-body.volume()-accent.volume())>.002)throw Error('Color solid partition failed');
        const group=new THREE.Group();
        for(const [solid,id,name] of [[body,c.body,'Body'],[accent,c.accent,'Emblem registration border branding']] as const){
            const color=filamentColors.find(v=>v.id===id);
            if(!color)throw Error('Unknown color');
            const mesh=new THREE.Mesh(geometry(solid),new THREE.MeshStandardMaterial({color:color.hex}));
            mesh.name=name;group.add(mesh);
        }
        const three=await exportTo3MF(group,{filament:'Generic PETG',printer_name:'Bambu Lab P2S',printerSettingsId:'Bambu Lab P2S 0.4 nozzle',printSettingsId:'0.16mm High Quality @BBL P2S'});
        const zip=await JSZip.loadAsync(await three.arrayBuffer());
        zip.file('Metadata/zenki-config.json',JSON.stringify(c));
        const model=await zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'model/3mf'});
        const stlMesh=new THREE.Mesh(geometry(complete));
        const stl=new STLExporter().parse(stlMesh,{binary:true});stlMesh.geometry.dispose();
        return {model,stl:new Blob([new Uint8Array(stl.buffer as ArrayBuffer)],{type:'model/stl'}),status:'client-generated Boolean solids; manufacturing review required',group,
          solidChecks:{kernel:'Manifold 3.5.5',bodyVolume:body.volume(),accentVolume:accent.volume(),completeVolume:complete.volume(),materialOverlapVolume:overlap}};
    } finally { for(const item of owned.reverse())item.delete(); }
}
