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
export function preferenceMessage(brand: string, registration: string, shape: Shape, border: Border, generated: boolean) {
  return ["Hello Zenki Lab, I'd like to discuss an Automotive Keytag.", `Brand: ${brand}`, `Registration: ${registration}`, `Shape: ${shape === "capsule" ? "Capsule" : "Rounded rectangle R5"}`, `Border: ${borderOptions.find(x=>x.id===border)?.name}`, "Colors: white body, navy raised emblem and registration; no background panels.", "Back: recessed ZenkiLab.com.", generated ? "I prefer this generated customer design. Please confirm pricing and production details." : "This is a request for CAD and logo review, not an approved/generated design."].join("\n");
}
