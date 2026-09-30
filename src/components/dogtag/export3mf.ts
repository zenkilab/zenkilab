import JSZip from "jszip";
import { exportTo3MF } from "three-3mf-exporter";
import { NFC_PAUSE_LAYER_Z, type DogTagConfig } from "@/lib/dogtag";
import { buildDogTagPrintGroup } from "./geometry";

/**
 * Print-ready 3MF for Bambu Studio: plate and accent already on filament slots 1 and 2 (colours
 * from the chosen combo). The NFC pocket is always present (unlike the Key Tag's optional NFC),
 * so a pause is always written into Metadata/custom_gcode_per_layer.xml: the printer stops once
 * the pocket is printed and before the first layer of its roof, where the operator drops the
 * (already programmed) chip in.
 */
export async function buildOrder3MF(cfg: DogTagConfig): Promise<Blob> {
  const blob = await exportTo3MF(buildDogTagPrintGroup(cfg), { filament: "Generic ASA" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<custom_gcodes_per_layer>
<plate>
<plate_info id="1"/>
<layer top_z="${NFC_PAUSE_LAYER_Z.toFixed(2)}" type="1" extruder="1" color="" extra="Place the programmed NFC chip in the pocket, then resume" gcode="M601"/>
<mode value="SingleExtruder"/>
</plate>
</custom_gcodes_per_layer>
`;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  zip.file("Metadata/custom_gcode_per_layer.xml", xml);
  const settings = JSON.parse(await zip.file("Metadata/project_settings.config")!.async("string"));
  settings.machine_pause_gcode = "M400 U1";
  zip.file("Metadata/project_settings.config", JSON.stringify(settings));
  return zip.generateAsync({ type: "blob", mimeType: "model/3mf", compression: "DEFLATE" });
}
