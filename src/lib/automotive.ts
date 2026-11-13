import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

import definitions from "./automotive-logo-definitions.json";
export const automotiveBrands = definitions.map(b=>({id:b.id,name:b.name,available:b.capability==="cad-validated",asset:b.asset,capability:b.capability,generatedRegistrations:b.id==="mercedes"?["CAV 3883"]:[]})).concat([{id:"other",name:"Request Your Car Logo",available:false,asset:"",capability:"source-pending",generatedRegistrations:[]}]);
export { filamentColors, contrast, registrationLayout } from "./automotive-config";
export const borderOptions = [
  { id: "none", name: "None", detail: "Clean silhouette" },
  { id: "thin", name: "Thin", detail: "0.48 mm line" },
  { id: "bold", name: "Bold", detail: "0.96 mm line" },
  { id: "double", name: "Double", detail: "Two 0.48 mm lines" },
] as const;
export type Border = typeof borderOptions[number]["id"];
export type Shape = "capsule" | "rounded-rectangle";
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);
export function preferenceMessage(brand: string, registration: string, shape: Shape, border: Border, generated: boolean) {
  return ["Hello Zenki Lab, I'd like to discuss an Automotive Keytag.", `Brand: ${brand}`, `Registration: ${registration}`, `Shape: ${shape === "capsule" ? "Capsule" : "Rounded rectangle R5"}`, `Border: ${borderOptions.find(x=>x.id===border)?.name}`, "Colors: white body, navy raised emblem and registration; no background panels.", "Back: recessed ZenkiLab.com.", generated ? "I prefer this generated customer design. Please confirm pricing and production details." : "This is a request for CAD and logo review, not an approved/generated design."].join("\n");
}
export function letteringPath(text:string,w:number,h:number,cx=0){
 const shapes=font.generateShapes(text,10).map(s=>s.extractPoints(20));const pts=shapes.flatMap(s=>s.shape);if(!pts.length)return "";
 const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));const k=Math.min(w/(x1-x0),h/(y1-y0));
 return shapes.map(s=>[s.shape,...s.holes].map(r=>"M "+r.map(p=>`${(p.x-(x0+x1)/2)*k+cx},${-(p.y-(y0+y1)/2)*k}`).join(" L ")+" Z").join(" ")).join(" ");
}
