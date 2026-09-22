"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildKeyTag } from "./geometry";
import { COMBOS, type KeyTagConfig } from "@/lib/keytag";

export type Capture = () => string;

function Tag({ config, flipped }: { config: KeyTagConfig; flipped: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { style, corner, text, branding, rfid, combo } = config;
  const geo = useMemo(() => buildKeyTag(config), [style, corner, text, branding, rfid]);
  useEffect(() => () => { geo.body.dispose(); geo.accent.dispose(); }, [geo]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const target = flipped ? Math.PI : 0;
    g.rotation.y += (target - g.rotation.y) * Math.min(1, dt * 8);
  });

  const c = COMBOS[combo];
  return (
    <group ref={group}>
      <mesh geometry={geo.body}>
        <meshStandardMaterial color={c.body} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh geometry={geo.accent}>
        <meshStandardMaterial color={c.accent} roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  );
}

function Grab({ apiRef }: { apiRef: MutableRefObject<Capture | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    apiRef.current = () => {
      gl.render(scene, camera);
      const src = gl.domElement;
      const out = document.createElement("canvas");
      out.width = 360;
      out.height = Math.round((360 * src.height) / src.width);
      out.getContext("2d")!.drawImage(src, 0, 0, out.width, out.height);
      return out.toDataURL("image/jpeg", 0.85);
    };
    return () => { apiRef.current = null; };
  }, [gl, scene, camera, apiRef]);
  return null;
}

export default function KeyTagScene({
  config,
  flipped,
  captureRef,
}: {
  config: KeyTagConfig;
  flipped: boolean;
  captureRef: MutableRefObject<Capture | null>;
}) {
  // Same discipline as the hero scene: dpr 1 on mobile, no postprocessing.
  const [dpr, setDpr] = useState(1);
  useEffect(() => setDpr(window.matchMedia("(max-width: 768px)").matches ? 1 : Math.min(2, window.devicePixelRatio)), []);

  return (
    <Canvas dpr={dpr} camera={{ position: [0, 0, 100], fov: 32 }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[30, 40, 60]} intensity={2.2} />
      <directionalLight position={[-40, -20, 30]} intensity={0.7} />
      {/* rim light so the black body reads against the empty background */}
      <directionalLight position={[60, 30, -25]} intensity={2.4} />
      <Tag config={config} flipped={flipped} />
      <OrbitControls enablePan={false} minDistance={55} maxDistance={150} />
      <Grab apiRef={captureRef} />
    </Canvas>
  );
}
