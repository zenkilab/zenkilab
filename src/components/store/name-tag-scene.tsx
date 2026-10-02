"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CONCEPTS, type ConceptId, type Staff } from "@/lib/name-tag";
import { drawArt, loadImage } from "./name-tag-art";

// Millimetres, front face is +Z. A 1.6 mm floor with the logo, rule and lettering raised 0.8 mm
// above it, as printed. Raised parts are a finely divided plane pushed out by a height map drawn
// from the same artwork as the colour map, so any font and any uploaded logo works.
const FLOOR = 1.6;
const RAISE = 0.8;
const RADIUS = 4;
const PX = 12; // texture pixels per mm
const SEG = 6; // mesh segments per mm

type Art = { color: THREE.CanvasTexture; height: THREE.CanvasTexture };
const tex = (cv: HTMLCanvasElement, srgb: boolean) => {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Front artwork twice: in colour on transparent, and as a white-on-black height map. */
function draw(concept: ConceptId, staff: Staff, logo: HTMLImageElement, font: string, accent: string): Art {
  return {
    color: tex(drawArt(concept, staff, logo, font, accent, PX, "color"), true),
    height: tex(drawArt(concept, staff, logo, font, accent, PX, "height"), false),
  };
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

export type Capture = () => string;
type Props = { concept: ConceptId; staff: Staff; logo: string; font: string; accent: string; flipped: boolean; captureRef?: MutableRefObject<Capture | null> };

/** Lets the page grab a small JPEG of the current view for the order email. */
function Grab({ apiRef }: { apiRef: MutableRefObject<Capture | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    apiRef.current = () => {
      gl.render(scene, camera);
      const src = gl.domElement;
      const out = document.createElement("canvas");
      out.width = 720;
      out.height = Math.round((720 * src.height) / src.width);
      out.getContext("2d")!.drawImage(src, 0, 0, out.width, out.height);
      return out.toDataURL("image/jpeg", 0.85);
    };
    return () => { apiRef.current = null; };
  }, [gl, scene, camera, apiRef]);
  return null;
}

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
      {props.captureRef && <Grab apiRef={props.captureRef} />}
    </Canvas>
  );
}
