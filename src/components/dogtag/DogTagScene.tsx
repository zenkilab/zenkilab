"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildDogTag } from "./geometry";
import { COMBOS, TAG, plateHeight, type DogTagConfig } from "@/lib/dogtag";

export type Capture = () => string;

/** Keeps the whole plate in frame as its height grows with collar width: refits the camera's distance
 * (along whatever direction the user last left it, so a manual rotate/zoom isn't undone) whenever the
 * plate's footprint changes, instead of leaving the fit tuned only for the default collar width. */
function AutoFrame({ collarWidthMm }: { collarWidthMm: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const vFov = (persp.fov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const h = plateHeight(collarWidthMm);
    const distForHeight = h / 2 / Math.tan(vFov / 2);
    const distForWidth = TAG.W / 2 / (Math.tan(vFov / 2) * aspect);
    const margin = 1.2; // breathing room so the plate doesn't touch the frame edge
    const distance = Math.max(distForHeight, distForWidth) * margin;
    const dir = camera.position.lengthSq() > 0 ? camera.position.clone().normalize() : new THREE.Vector3(0, 0, 1);
    camera.position.copy(dir.multiplyScalar(distance));
    camera.updateProjectionMatrix();
  }, [collarWidthMm, camera, size]);
  return null;
}

function Tag({ config, flipped }: { config: DogTagConfig; flipped: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { collarWidthMm, phone, petName, combo, showText } = config;
  const geo = useMemo(() => buildDogTag(config), [collarWidthMm, phone, petName, combo, showText]);
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

export default function DogTagScene({
  config,
  flipped,
  captureRef,
}: {
  config: DogTagConfig;
  flipped: boolean;
  captureRef: MutableRefObject<Capture | null>;
}) {
  const [dpr, setDpr] = useState(1);
  useEffect(() => setDpr(window.matchMedia("(max-width: 768px)").matches ? 1 : Math.min(2, window.devicePixelRatio)), []);

  return (
    <Canvas dpr={dpr} camera={{ position: [0, 0, 100], fov: 32 }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[30, 40, 60]} intensity={2.2} />
      <directionalLight position={[-40, -20, 30]} intensity={0.7} />
      <directionalLight position={[60, 30, -25]} intensity={2.4} />
      <Tag config={config} flipped={flipped} />
      <AutoFrame collarWidthMm={config.collarWidthMm} />
      <OrbitControls enablePan={false} minDistance={55} maxDistance={220} />
      <Grab apiRef={captureRef} />
    </Canvas>
  );
}
