import fontData from "@/components/keytag/montserrat_bold.typeface.json";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

export const automotiveBrands = [
  { id: "mercedes", name: "Mercedes-Benz", available: true, generatedRegistrations: ["CAV 3883"] },
  ...["Toyota", "BMW", "Honda", "Nissan", "Audi", "Suzuki", "Mitsubishi", "Hyundai", "Kia"].map(name => ({ id: name.toLowerCase(), name, available: false, generatedRegistrations: [] as string[] })),
  { id: "other", name: "Other / Request Your Logo", available: false, generatedRegistrations: [] as string[] },
];
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
