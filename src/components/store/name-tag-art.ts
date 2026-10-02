import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";

// One drawing of the badge front, shared by the 3D preview and the print file so they cannot drift apart.
// "color": real colours on transparent. "height": everything raised, white on black.
// "accent" / "ink": one filament's share of the raised parts, white on black.
export type Mode = "color" | "height" | "accent" | "ink";

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => no(new Error("Could not read the logo."));
    i.src = src;
  });
}

export function drawArt(concept: ConceptId, staff: Staff, logo: HTMLImageElement, font: string, accent: string, px: number, mode: Mode) {
  const base = CONCEPTS[concept];
  const c = { ...base, accent, role: concept === "B" ? accent : base.role };
  const cv = document.createElement("canvas");
  cv.width = c.w * px;
  cv.height = c.h * px;
  const g = cv.getContext("2d")!;
  if (mode !== "color") { g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height); }
  g.scale(px, px);
  const on = (layer: "accent" | "ink") => mode === "color" || mode === "height" || mode === layer;
  const ink = (col: string) => (mode === "color" ? col : "#fff");
  const roleLayer = concept === "B" ? "accent" : "ink";

  if (on("accent")) {
    // logo recoloured: draw it, then keep only its shape in the ink colour
    const t = document.createElement("canvas");
    t.width = t.height = 512;
    const tg = t.getContext("2d")!;
    const k = Math.min(512 / (logo.naturalWidth || 512), 512 / (logo.naturalHeight || 512));
    const lw = (logo.naturalWidth || 512) * k, lh = (logo.naturalHeight || 512) * k;
    tg.drawImage(logo, (512 - lw) / 2, (512 - lh) / 2, lw, lh);
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = ink(c.accent);
    tg.fillRect(0, 0, 512, 512);
    g.drawImage(t, 3, (c.h - c.logo) / 2, c.logo, c.logo);
  }

  const fit = (text: string, size: number, weight: number) => {
    g.font = `${weight} ${size}px "${font}", Inter, sans-serif`;
    const w = g.measureText(text).width || 1;
    g.font = `${weight} ${size * Math.max(0.7, Math.min(1, c.textW / w))}px "${font}", Inter, sans-serif`;
  };
  const x = 3 + c.logo + c.gap;
  const nameH = c.nameSize * 1.15, roleH = c.roleSize * 1.15, gap = 0.8, ruleH = 0.7;
  const y0 = (c.h - (nameH + gap + ruleH + gap + roleH)) / 2;
  g.textBaseline = "middle";
  g.textAlign = "left";
  if (on("ink")) {
    fit(staff.name, c.nameSize, 600);
    g.fillStyle = ink(c.name);
    g.fillText(staff.name, x, y0 + nameH / 2, c.textW);
  }
  if (on("accent")) {
    g.fillStyle = ink(c.accent);
    g.fillRect(x, y0 + nameH + gap, concept === "A" ? 10 : 8, ruleH);
  }
  if (on(roleLayer)) {
    fit(staff.role, c.roleSize, 500);
    g.fillStyle = ink(c.role);
    g.fillText(staff.role, x, y0 + nameH + gap + ruleH + gap + roleH / 2, c.textW);
  }
  return cv;
}
