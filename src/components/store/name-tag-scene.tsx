"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";

// Millimetres, front face is +Z. A 1.6 mm floor with the logo, rule and lettering raised 0.8 mm
// above it, as printed. Raised parts are a finely divided plane pushed out by a height map drawn
// from the same artwork as the colour map, so any font and any uploaded logo works.
const FLOOR = 1.6;
const RAISE = 0.8;
const RADIUS = 4;
const PX = 12; // texture pixels per mm
const SEG = 6; // mesh segments per mm

type Art = { color: THREE.CanvasTexture; height: THREE.CanvasTexture };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => no(new Error("logo"));
    i.src = src;
  });
}

/** Draws the front artwork twice: in colour on transparent, and as white-on-black for the height map. */
function draw(concept: ConceptId, staff: Staff, logo: HTMLImageElement, font: string, accent: string): Art {
  const base = CONCEPTS[concept];
  const c = { ...base, accent, role: concept === "B" ? accent : base.role };
  const mk = (mono: boolean) => {
    const cv = document.createElement("canvas");
    cv.width = c.w * PX;
    cv.height = c.h * PX;
    const g = cv.getContext("2d")!;
    if (mono) { g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height); }
    g.scale(PX, PX);
    const ink = (col: string) => (mono ? "#fff" : col);

    // logo, recoloured: draw it, then keep only its shape in the ink colour
    const lx = 3, ly = (c.h - c.logo) / 2;
    const t = document.createElement("canvas");
    t.width = t.height = 512;
    const tg = t.getContext("2d")!;
    const k = Math.min(512 / (logo.naturalWidth || 512), 512 / (logo.naturalHeight || 512));
    const lw = (logo.naturalWidth || 512) * k, lh = (logo.naturalHeight || 512) * k;
    tg.drawImage(logo, (512 - lw) / 2, (512 - lh) / 2, lw, lh);
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = ink(c.accent);
    tg.fillRect(0, 0, 512, 512);
    g.drawImage(t, lx, ly, c.logo, c.logo);

    // text column: name, rule, role, centred as one block
    const fit = (text: string, size: number, weight: number) => {
      g.font = `${weight} ${size}px "${font}", Inter, sans-serif`;
      const w = g.measureText(text).width || 1;
      const s = size * Math.max(0.7, Math.min(1, c.textW / w));
      g.font = `${weight} ${s}px "${font}", Inter, sans-serif`;
      return s;
    };
    const x = lx + c.logo + c.gap;
    const nameH = c.nameSize * 1.15, roleH = c.roleSize * 1.15, gap = 0.8, ruleH = 0.7;
    const y0 = (c.h - (nameH + gap + ruleH + gap + roleH)) / 2;
    g.textBaseline = "middle";
    g.textAlign = "left";
    fit(staff.name, c.nameSize, 600);
    g.fillStyle = ink(c.name);
    g.fillText(staff.name, x, y0 + nameH / 2, c.textW);
    g.fillStyle = ink(c.accent);
    g.fillRect(x, y0 + nameH + gap, concept === "A" ? 10 : 8, ruleH);
    fit(staff.role, c.roleSize, 500);
    g.fillStyle = ink(c.role);
    g.fillText(staff.role, x, y0 + nameH + gap + ruleH + gap + roleH / 2, c.textW);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = mono ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  return { color: mk(false), height: mk(true) };
}

/** Pin pocket outlines on the back, drawn flat. */
function drawBack(concept: ConceptId, accent: string) {
  const c = CONCEPTS[concept];
  const cv = document.createElement("canvas");
  cv.width = c.w * PX;
  cv.height = c.h * PX;
  const g = cv.getContext("2d")!;
  g.scale(PX, PX);
  const ink = concept === "A" ? "#8A4A2B" : accent;
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = 0.35;
  g.setLineDash([1.2, 0.8]);
  for (const x of c.pins) g.strokeRect(x - 12.5, c.h / 2 - 4, 25, 8);
  g.setLineDash([]);
  g.font = '1.8px "IBM Plex Mono", monospace';
  g.textAlign = "center";
  g.fillText("flat back, pin pockets dashed", c.w / 2, c.h - 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}

function Badge({ concept, staff, logo, font, accent, flipped }: Props) {
  const group = useRef<THREE.Group>(null);
  const c = CONCEPTS[concept];
  const [art, setArt] = useState<Art | null>(null);
  const back = useMemo(() => drawBack(concept, accent), [concept, accent]);
  useEffect(() => () => back.dispose(), [back]);

  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(c.w, c.h, RADIUS), { depth: FLOOR, bevelEnabled: false, curveSegments: 24 });
    return g;
  }, [c.w, c.h]);
  const plane = useMemo(() => new THREE.PlaneGeometry(c.w, c.h, Math.round(c.w * SEG), Math.round(c.h * SEG)), [c.w, c.h]);
  useEffect(() => () => { body.dispose(); plane.dispose(); }, [body, plane]);

  // Redraw when anything on the front changes, once the chosen font has loaded.
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        await Promise.all([document.fonts.load(`600 20px "${font}"`), document.fonts.load(`500 20px "${font}"`)]);
        const img = await loadImage(logo);
        if (dead) return;
        const next = draw(concept, staff, img, font, accent);
        setArt((old) => { old?.color.dispose(); old?.height.dispose(); return next; });
      } catch { /* a bad logo never reaches here: the page checks it first */ }
    })();
    return () => { dead = true; };
  }, [concept, staff.name, staff.role, logo, font, accent]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += ((flipped ? Math.PI : 0) - g.rotation.y) * Math.min(1, dt * 8);
  });

  return (
    <group ref={group}><group position={[0, 0, -FLOOR / 2]}>
      <mesh geometry={body}>
        <meshStandardMaterial color={c.solid} roughness={0.75} metalness={0} />
      </mesh>
      {art && (
        <mesh geometry={plane} position={[0, 0, FLOOR]}>
          <meshStandardMaterial map={art.color} alphaTest={0.5} displacementMap={art.height} displacementScale={RAISE} roughness={0.7} />
        </mesh>
      )}
      <mesh geometry={plane} position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial map={back} transparent roughness={0.8} />
        </mesh>
    </group></group>
  );
}

type Props = { concept: ConceptId; staff: Staff; logo: string; font: string; accent: string; flipped: boolean };

export default function NameTagScene(props: Props) {
  // Same discipline as the key tag scene: dpr 1 on mobile, no postprocessing.
  const [dpr] = useState(() => (window.matchMedia("(max-width: 768px)").matches ? 1 : Math.min(2, window.devicePixelRatio)));
  return (
    <Canvas dpr={dpr} camera={{ position: [0, 0, 150], fov: 32 }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[30, 40, 60]} intensity={2.2} />
      <directionalLight position={[-40, -20, 30]} intensity={0.7} />
      <directionalLight position={[60, 30, -25]} intensity={2.4} />
      <Badge {...props} />
      <OrbitControls enablePan={false} minDistance={70} maxDistance={220} />
    </Canvas>
  );
}
