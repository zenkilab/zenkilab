import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

import definitions from "./automotive-logo-definitions.json";
export const automotiveBrands = definitions.map(b=>({id:b.id,name:b.name,available:b.capability==="cad-validated",asset:b.asset,capability:b.capability,generatedRegistrations:b.id==="mercedes"?["CAV 3883"]:[]})).concat([{id:"other",name:"Request Your Car Logo",available:false,asset:"",capability:"source-pending",generatedRegistrations:[]}]);
export const filamentColors=[{id:"white",name:"White",hex:"#f2f3f2",status:"Existing preset; stock to confirm"},{id:"navy",name:"Navy",hex:"#102c4c",status:"Existing preset; stock to confirm"},{id:"black",name:"Black",hex:"#17191d",status:"Proposed; stock to confirm"},{id:"silver",name:"Silver",hex:"#b5bac1",status:"Proposed; stock to confirm"},{id:"red",name:"Red",hex:"#b52d36",status:"Proposed; stock to confirm"}];
export function contrast(a:string,b:string){const lum=(h:string)=>{const x=h.match(/\w\w/g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
export const borderOptions = [
  { id: "none", name: "None", detail: "Clean silhouette" },
  { id: "thin", name: "Thin", detail: "0.48 mm line" },
  { id: "bold", name: "Bold", detail: "0.96 mm line" },
  { id: "double", name: "Double", detail: "Two 0.48 mm lines" },
] as const;
export type Border = typeof borderOptions[number]["id"];
export type Shape = "capsule" | "rounded-rectangle";
const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader["parse"]>[0]);
export function registrationLayout(value: string) {
  const text = value.toUpperCase().replace(/\s+/g, " ").trim();
  if (!/^[A-Z0-9 -]{2,12}$/.test(text) || !/[A-Z0-9]/.test(text)) return { text, valid: false, width: 0, height: 0, reason: "Use 2–12 letters, numbers, spaces or hyphens." };
  const points = font.generateShapes(text,10).flatMap(s => s.extractPoints(20).shape);
  if (!points.length) return { text, valid: false, width: 0, height: 0, reason: "Enter a registration number." };
  const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
  const w=Math.max(...xs)-Math.min(...xs), h=Math.max(...ys)-Math.min(...ys);
  const scale=Math.min(25/w,6/h); const width=w*scale, height=h*scale;
  return { text, valid: height>=3.2, width, height, reason: height>=3.2 ? "Proportional layout fits the reserved 25 × 6 mm area. New lettering needs CAD review." : "Too small for clear lettering. Shorten the registration." };
}
export function preferenceMessage(brand: string, registration: string, shape: Shape, border: Border, generated: boolean) {
  return ["Hello Zenki Lab, I'd like to discuss an Automotive Keytag.", `Brand: ${brand}`, `Registration: ${registration}`, `Shape: ${shape === "capsule" ? "Capsule" : "Rounded rectangle R5"}`, `Border: ${borderOptions.find(x=>x.id===border)?.name}`, "Colors: white body, navy raised emblem and registration; no background panels.", "Back: recessed ZenkiLab.com.", generated ? "I prefer this generated customer design. Please confirm pricing and production details." : "This is a request for CAD and logo review, not an approved/generated design."].join("\n");
}
export function letteringPath(text:string,w:number,h:number,cx=0){
 const shapes=font.generateShapes(text,10).map(s=>s.extractPoints(20));const pts=shapes.flatMap(s=>s.shape);if(!pts.length)return "";
 const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x)),y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));const k=Math.min(w/(x1-x0),h/(y1-y0));
 return shapes.map(s=>[s.shape,...s.holes].map(r=>"M "+r.map(p=>`${(p.x-(x0+x1)/2)*k+cx},${-(p.y-(y0+y1)/2)*k}`).join(" L ")+" Z").join(" ")).join(" ");
}
