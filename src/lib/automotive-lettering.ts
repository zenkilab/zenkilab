import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);
export function letteringPath(text:string,w:number,h:number,cx=0){
 const shapes=font.generateShapes(text,10).map(s=>s.extractPoints(20));const pts=shapes.flatMap(s=>s.shape);if(!pts.length)return "";
 const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));const k=Math.min(w/(x1-x0),h/(y1-y0));
 return shapes.map(s=>[s.shape,...s.holes].map(r=>"M "+r.map(p=>`${(p.x-(x0+x1)/2)*k+cx},${-(p.y-(y0+y1)/2)*k}`).join(" L ")+" Z").join(" ")).join(" ");
}
