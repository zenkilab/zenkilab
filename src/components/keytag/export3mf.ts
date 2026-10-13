import * as THREE from "three";
import JSZip from "jszip";
import { exportTo3MF } from "three-3mf-exporter";
import { NFC_PAUSE_LAYER_Z, TAG, type KeyTagConfig } from "@/lib/keytag";
import { buildPrintGroup } from "./geometry";

const COLS = 3;
const GAP_X = 12; // mm
const GAP_Y = 12; // mm

/**
 * Print-ready 3MF for Bambu Studio: floor and accent already on filament slots 1 and 2
 * (colours from the chosen combo). When multiple tags are provided, they are laid out
 * side-by-side on the print bed. When NFC is on for any tag, a pause is written into
 * Metadata/custom_gcode_per_layer.xml so the printer stops once the pocket is printed and
 * before the first layer of the roof, which is where the operator drops the inlay in.
 */
export async function buildOrder3MF(cfg: KeyTagConfig | KeyTagConfig[]): Promise<Blob> {
  const configs = Array.isArray(cfg) ? cfg : [cfg];
  let exportTarget: THREE.Object3D;

  if (configs.length === 1) {
    exportTarget = buildPrintGroup(configs[0]);
  } else {
    const root = new THREE.Group();
    root.name = "ZenkiLab Key Tags";
    configs.forEach((item, index) => {
      const g = buildPrintGroup(item);
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      g.position.set(col * (TAG.W + GAP_X), -row * (TAG.H + GAP_Y), 0);
      root.add(g);
    });
    exportTarget = root;
  }

  const blob = await exportTo3MF(exportTarget, { filament: "Generic PETG" });
  const hasNfc = configs.some((c) => c.nfc);
  if (!hasNfc) return blob;

  // Bambu inserts the pause before the layer whose top is `top_z` (see NFC_PAUSE_LAYER_Z).
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<custom_gcodes_per_layer>
<plate>
<plate_info id="1"/>
<layer top_z="${NFC_PAUSE_LAYER_Z.toFixed(2)}" type="1" extruder="1" color="" extra="Place the NFC inlay in the pocket, then resume" gcode="M601"/>
<mode value="SingleExtruder"/>
</plate>
</custom_gcodes_per_layer>
`;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  zip.file("Metadata/custom_gcode_per_layer.xml", xml);
  // The exporter writes a partial project config, so name the pause G-code (Bambu A1 preset value)
  // instead of trusting the slicer to fill it in, otherwise the pause can come out empty.
  const settings = JSON.parse((await zip.file("Metadata/project_settings.config")!.async("string")));
  settings.machine_pause_gcode = "M400 U1";
  zip.file("Metadata/project_settings.config", JSON.stringify(settings));
  return zip.generateAsync({ type: "blob", mimeType: "model/3mf", compression: "DEFLATE" });
}
