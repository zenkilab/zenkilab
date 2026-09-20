import JSZip from "jszip";
import { exportTo3MF } from "three-3mf-exporter";
import { RFID_PAUSE_LAYER_Z, type KeyTagConfig } from "@/lib/keytag";
import { buildPrintGroup } from "./geometry";

/**
 * Print-ready 3MF for Bambu Studio: floor and accent already on filament slots 1 and 2
 * (colours from the chosen combo). When RFID is on, a pause is written into
 * Metadata/custom_gcode_per_layer.xml so the printer stops once the pocket is printed and
 * before the first layer of the roof, which is where the operator drops the inlay in.
 */
export async function buildOrder3MF(cfg: KeyTagConfig): Promise<Blob> {
  const blob = await exportTo3MF(buildPrintGroup(cfg), { filament: "Generic PETG" });
  if (!cfg.rfid) return blob;

  // Bambu inserts the pause before the layer whose top is `top_z` (see RFID_PAUSE_LAYER_Z).
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<custom_gcodes_per_layer>
<plate>
<plate_info id="1"/>
<layer top_z="${RFID_PAUSE_LAYER_Z.toFixed(2)}" type="1" extruder="1" color="" extra="Place the RFID inlay in the pocket, then resume" gcode="M601"/>
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
