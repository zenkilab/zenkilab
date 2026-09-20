"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { buildKeyTag } from "@/components/keytag/geometry";
import { COMBOS, type KeyTagConfig } from "@/lib/keytag";

const config: KeyTagConfig = { content: "name", style: "capsule", combo: "heritage", text: "ZENKI", branding: true, rfid: false };

function Tag({ yaw, zoom }: { yaw: MotionValue<number>; zoom: MotionValue<number> }) {
  const invalidate = useThree((s) => s.invalidate);
  const geo = useMemo(() => buildKeyTag(config), []);
  useEffect(() => () => { geo.body.dispose(); geo.accent.dispose(); }, [geo]);
  const group = useRef<Group>(null);
  // frameloop is on demand: turn and size the tag, then redraw, whenever either value moves
  useEffect(() => {
    const apply = () => {
      const g = group.current;
      if (g) {
        g.rotation.y = yaw.get();
        g.scale.setScalar(zoom.get());
      }
      invalidate();
    };
    apply();
    const offs = [yaw.on("change", apply), zoom.on("change", apply)];
    return () => offs.forEach((off) => off());
  }, [yaw, zoom, invalidate]);
  const c = COMBOS[config.combo];
  return (
    <group ref={group} rotation={[0.3, 0, 0.06]}>
      <mesh geometry={geo.body}>
        <meshStandardMaterial color={c.body} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh geometry={geo.accent}>
        <meshStandardMaterial color={c.accent} roughness={0.35} metalness={0.25} />
      </mesh>
    </group>
  );
}

/**
 * The real key tag geometry, turned by scroll. A hard circle sits behind it and the canvas is
 * larger than the circle, so the tag comes out of the circle as it turns.
 *
 * Smoothness: wheel scrolling arrives in big steps, so the scroll values are eased with a
 * spring before they turn the tag. Size is changed inside the 3D scene, not by scaling the
 * canvas with CSS, which would resample the bitmap on every frame.
 */
export default function KeyTagSpin({ yaw, zoom }: { yaw: MotionValue<number>; zoom?: MotionValue<number> }) {
  const one = useMotionValue(1);
  const smoothYaw = useSpring(yaw, { stiffness: 70, damping: 20, mass: 0.7 });
  const smoothZoom = useSpring(zoom ?? one, { stiffness: 90, damping: 22, mass: 0.7 });
  return (
    <div className="relative aspect-square w-full">
      <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }} />
      <div className="pointer-events-none absolute" style={{ inset: "-22%" }} aria-hidden="true">
        <Canvas dpr={[1, 1.75]} frameloop="demand" gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 138], fov: 32 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[30, 40, 60]} intensity={2.4} />
          <directionalLight position={[-40, -20, 30]} intensity={0.8} />
          <directionalLight position={[60, 30, -25]} intensity={3} />
          <Tag yaw={smoothYaw} zoom={smoothZoom} />
        </Canvas>
      </div>
    </div>
  );
}
