"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";

interface PrinterProps {
  mouse: React.RefObject<{ x: number; y: number }>;
  position?: [number, number, number];
}

// ══════════════════════════════════════════════════════════════════════
// Procedural gear geometry
// ══════════════════════════════════════════════════════════════════════
function createGearGeometry(
  radius: number,
  teeth: number,
  toothDepth: number,
  thickness: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outerRadius = radius;
  const innerRadius = radius - toothDepth;
  const numPoints = teeth * 4;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const r = i % 4 === 1 || i % 4 === 2 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const holePath = new THREE.Path();
  holePath.absarc(0, 0, radius * 0.3, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/** Rounded replacement for boxGeometry. Radius scales with the part's smallest side, smoothness 2 keeps it cheap. */
function Box({
  size,
  ...props
}: { size: [number, number, number] } & Omit<React.ComponentProps<typeof RoundedBox>, "args" | "radius" | "smoothness">) {
  return <RoundedBox args={size} radius={Math.min(...size) * 0.28} smoothness={4} {...props} />;
}

/**
 * Printer
 * ───────
 * Open 2‑pillar 3D printer with premium brand-aligned materials.
 * Rich charcoal frame, pearl-white toolhead, amber brand accent,
 * polished chrome rails, and brass nozzle.
 */
export function Printer({ mouse, position = [2.8, -0.72, -0.08] }: PrinterProps) {
  const rigRef = useRef<Group>(null);
  const gantryRef = useRef<Group>(null);
  const toolheadRef = useRef<Group>(null);
  const bedRef = useRef<Group>(null);
  const gear1Ref = useRef<Group>(null);
  const gear2Ref = useRef<Group>(null);
  const gear3Ref = useRef<Group>(null);

  const S = 0.52;
  const baseWidth = 3.2 * S;
  const baseDepth = 3.6 * S;
  const pillarHeight = 3.8 * S;
  const pillarX = 1.4 * S;
  const gearMaxThickness = 0.25 * S;

  // ── Premium material palette — Zenki Amber brand accents ──
  const matFrame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#232930", metalness: 0.7, roughness: 0.36 }),
    [],
  );
  const matFrameAccent = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#161A20", metalness: 0.8, roughness: 0.3 }),
    [],
  );
  const matBracket = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#171B21", metalness: 0.85, roughness: 0.3 }),
    [],
  );
  const matToolhead = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#D2CEC7", metalness: 0.08, roughness: 0.5 }),
    [],
  );
  const matBedCarrier = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#B9B4AB", metalness: 0.5, roughness: 0.45 }),
    [],
  );
  const matPEI = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#BFBAB2", metalness: 0.25, roughness: 0.55 }),
    [],
  );
  const matChrome = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ECEDEE", metalness: 0.97, roughness: 0.12 }),
    [],
  );
  const matGear = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F5A623", metalness: 0.65, roughness: 0.32 }),
    [],
  );
  const matBrass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F5A623", metalness: 0.92, roughness: 0.18 }),
    [],
  );
  const matAmber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F5A623", metalness: 0.3, roughness: 0.42 }),
    [],
  );
  const matAmberAccent = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F5A623", emissive: "#F5A623", emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.3 }),
    [],
  );

  // Emissive amber for the light strip and the hot nozzle tip
  const matAmberGlow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F5A623", emissive: "#F5A623", emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.4 }),
    [],
  );
  const matFlange = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#161A20", metalness: 0.8, roughness: 0.3 }),
    [],
  );
  // Soft contact shadow so the printer sits on the scene instead of floating
  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,0.6)");
    g.addColorStop(0.6, "rgba(0,0,0,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  // ── Pre‑generated gear geometries ──
  const geoGear1 = useMemo(
    () => createGearGeometry(0.55 * S, 14, 0.08 * S, gearMaxThickness),
    [S, gearMaxThickness],
  );
  const geoGear2 = useMemo(
    () => createGearGeometry(0.4 * S, 10, 0.08 * S, gearMaxThickness),
    [S, gearMaxThickness],
  );
  const geoGear3 = useMemo(
    () => createGearGeometry(0.3 * S, 8, 0.07 * S, gearMaxThickness),
    [S, gearMaxThickness],
  );

  const g1x = -0.35 * S;
  const g1z = 0.1 * S;
  const g2x = 0.5 * S;
  const g2z = 0.1 * S;
  const g3x = 0.05 * S;
  const g3z = -0.55 * S;

  // ── Animation ──
  useFrame(({ clock }) => {
    const root = rigRef.current;
    if (root) {
      root.rotation.y = THREE.MathUtils.lerp(
        root.rotation.y,
        -0.302 + mouse.current.x * 0.04,
        0.05,
      );
      root.rotation.x = THREE.MathUtils.lerp(
        root.rotation.x,
        Math.sin(clock.getElapsedTime() * 0.35) * 0.006 - mouse.current.y * 0.02,
        0.05,
      );
    }

    const elapsed = clock.getElapsedTime();
    const printProgress = (elapsed % 16) / 16;

    if (gantryRef.current) {
      gantryRef.current.position.y = 0.91 * S + printProgress * gearMaxThickness;
    }

    const gearScaleY = Math.max(0.001, printProgress);
    if (gear1Ref.current) gear1Ref.current.scale.set(1, gearScaleY, 1);
    if (gear2Ref.current) gear2Ref.current.scale.set(1, gearScaleY, 1);
    if (gear3Ref.current) gear3Ref.current.scale.set(1, gearScaleY, 1);

    const activeCycle = Math.floor((elapsed * 1.5) % 3);
    let targetX = 0;
    let targetBedZ = 0;

    if (activeCycle === 0) {
      targetX = g1x + Math.sin(elapsed * 6) * 0.45 * S;
      targetBedZ = -g1z + Math.cos(elapsed * 6) * 0.45 * S;
    } else if (activeCycle === 1) {
      targetX = g2x + Math.sin(elapsed * 7) * 0.32 * S;
      targetBedZ = -g2z + Math.cos(elapsed * 7) * 0.32 * S;
    } else {
      targetX = g3x + Math.sin(elapsed * 8) * 0.22 * S;
      targetBedZ = -g3z + Math.cos(elapsed * 8) * 0.22 * S;
    }

    if (toolheadRef.current) {
      toolheadRef.current.position.x += (targetX - toolheadRef.current.position.x) * 0.1;
    }
    if (bedRef.current) {
      bedRef.current.position.z += (targetBedZ - bedRef.current.position.z) * 0.1;
    }
  });

  return (
    <group ref={rigRef} position={position}>
      {/* Soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <planeGeometry args={[baseWidth * 1.9, baseDepth * 1.9]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
      {/* ═══ BASE FRAME — Y-Rails ═══ */}
      <Box size={[0.2 * S, 0.2 * S, baseDepth]} position={[-1.4 * S, 0.1 * S, 0]} material={matFrame} castShadow />
      <Box size={[0.2 * S, 0.2 * S, baseDepth]} position={[1.4 * S, 0.1 * S, 0]} material={matFrame} castShadow />
      <Box size={[baseWidth, 0.2 * S, 0.2 * S]} position={[0, 0.1 * S, baseDepth / 2]} material={matFrame} castShadow />
      <Box size={[baseWidth, 0.2 * S, 0.2 * S]} position={[0, 0.1 * S, -baseDepth / 2]} material={matFrame} castShadow />

      {/* Y linear rods — chrome */}
      <mesh
        position={[-0.7 * S, 0.22 * S, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={matChrome}
      >
        <cylinderGeometry args={[0.04 * S, 0.04 * S, baseDepth - 0.4 * S, 16]} />
      </mesh>
      <mesh
        position={[0.7 * S, 0.22 * S, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={matChrome}
      >
        <cylinderGeometry args={[0.04 * S, 0.04 * S, baseDepth - 0.4 * S, 16]} />
      </mesh>

      {/* ═══ VERTICAL PILLARS & TOP CROSSBAR ═══ */}
      <Box size={[0.2 * S, pillarHeight, 0.2 * S]} position={[-pillarX, pillarHeight / 2 + 0.2 * S, 0]} material={matFrame} castShadow />
      <Box size={[0.2 * S, pillarHeight, 0.2 * S]} position={[pillarX, pillarHeight / 2 + 0.2 * S, 0]} material={matFrame} castShadow />
      <Box size={[baseWidth + 0.2 * S, 0.2 * S, 0.2 * S]} position={[0, pillarHeight + 0.2 * S, 0]} material={matFrameAccent} castShadow />
      {/* Amber light strip along the front of the crossbar */}
      <Box size={[baseWidth * 0.78, 0.022 * S, 0.012 * S]} position={[0, pillarHeight + 0.2 * S, 0.1 * S + 0.004]} material={matAmberGlow} />

      {/* Corner brackets — dark */}
      {([-pillarX, pillarX] as number[]).map((xPos) => (
        <group key={`brackets-${xPos}`}>
          <Box size={[0.35 * S, 0.35 * S, 0.35 * S]} position={[xPos, pillarHeight + 0.2 * S, 0]} material={matBracket} />
          <Box size={[0.35 * S, 0.35 * S, 0.35 * S]} position={[xPos, 0.2 * S, 0]} material={matBracket} />
        </group>
      ))}

      {/* Z lead screws — chrome */}
      <mesh
        position={[-pillarX + 0.2 * S, pillarHeight / 2 + 0.1 * S, -0.15 * S]}
        material={matChrome}
      >
        <cylinderGeometry args={[0.035 * S, 0.035 * S, pillarHeight - 0.2 * S, 16]} />
      </mesh>
      <mesh
        position={[pillarX - 0.2 * S, pillarHeight / 2 + 0.1 * S, -0.15 * S]}
        material={matChrome}
      >
        <cylinderGeometry args={[0.035 * S, 0.035 * S, pillarHeight - 0.2 * S, 16]} />
      </mesh>

      {/* Spool holder — hub dark, winding = amber brand filament */}
      <group position={[-0.6 * S, pillarHeight + 0.7 * S, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={matBedCarrier}>
          <cylinderGeometry args={[0.38 * S, 0.38 * S, 0.45 * S, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={matAmber}>
          <cylinderGeometry args={[0.78 * S, 0.78 * S, 0.42 * S, 32]} />
        </mesh>
        {/* Dark flanges on both sides of the winding */}
        {[-0.225 * S, 0.225 * S].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matFlange}>
            <cylinderGeometry args={[0.86 * S, 0.86 * S, 0.03 * S, 40]} />
          </mesh>
        ))}
      </group>

      {/* ═══ HEATED BED ═══ */}
      <group ref={bedRef} position={[0, 0.26 * S, 0]}>
        <Box size={[2.4 * S, 0.06 * S, 2.4 * S]} position={[0, 0.03 * S, 0]} material={matBedCarrier} />
        {/* PEI sheet — warm light grey */}
        <Box size={[2.3 * S, 0.04 * S, 2.3 * S]} position={[0, 0.08 * S, 0]} material={matPEI} />

        {/* Bed grid lines — subtle premium detail */}
        <mesh position={[0, 0.105 * S, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2 * S, 2.2 * S]} />
          <meshBasicMaterial color="#38C8F5" wireframe transparent opacity={0.06} />
        </mesh>

        {/* Levelling knobs */}
        {[-1.0 * S, 1.0 * S].map((x) =>
          [-1.0 * S, 1.0 * S].map((z) => (
            <mesh key={`knob-${x}-${z}`} position={[x, 0.01 * S, z]} material={matBracket}>
              <cylinderGeometry args={[0.12 * S, 0.12 * S, 0.04 * S, 16]} />
            </mesh>
          )),
        )}

        {/* ═══ 3 premium metallic gears ═══ */}
        <group ref={gear1Ref} position={[g1x, 0.1 * S, g1z]}>
          <mesh geometry={geoGear1} material={matGear} castShadow />
        </group>
        <group ref={gear2Ref} position={[g2x, 0.1 * S, g2z]} rotation={[0, Math.PI / 10, 0]}>
          <mesh geometry={geoGear2} material={matGear} castShadow />
        </group>
        <group ref={gear3Ref} position={[g3x, 0.1 * S, g3z]}>
          <mesh geometry={geoGear3} material={matGear} castShadow />
        </group>
      </group>

      {/* ═══ X‑GANTRY ═══ */}
      <group ref={gantryRef} position={[0, 0.91 * S, 0]}>
        <Box size={[baseWidth, 0.18 * S, 0.18 * S]} material={matFrameAccent} castShadow />

        <Box size={[0.35 * S, 0.45 * S, 0.35 * S]} position={[-pillarX, 0, 0]} material={matBracket} />
        <Box size={[0.35 * S, 0.45 * S, 0.35 * S]} position={[pillarX, 0, 0]} material={matBracket} />

        {/* Toolhead — warm pearl-white, with amber brand accent stripe */}
        <group ref={toolheadRef} position={[0, 0, 0.15 * S]}>
          <Box size={[0.55 * S, 0.6 * S, 0.45 * S]} material={matToolhead} castShadow />
          {/* Fan duct — pearl white */}
          <Box size={[0.45 * S, 0.25 * S, 0.1 * S]} position={[0, -0.15 * S, 0.23 * S]} material={matToolhead} />
          {/* Brand accent stripe, amber */}
          <Box size={[0.5 * S, 0.03 * S, 0.02 * S]} position={[0, 0.15 * S, 0.23 * S]} material={matAmberAccent} />
          {/* Heater block — chrome */}
          <Box size={[0.18 * S, 0.12 * S, 0.18 * S]} position={[0, -0.38 * S, 0]} material={matChrome} />
          {/* Brass nozzle */}
          <mesh position={[0, -0.48 * S, 0]} rotation={[Math.PI, 0, 0]} material={matBrass}>
            <coneGeometry args={[0.06 * S, 0.12 * S, 16]} />
          </mesh>
          {/* Hot tip and the light it throws on the print */}
          <mesh position={[0, -0.545 * S, 0]} material={matAmberGlow}>
            <sphereGeometry args={[0.024 * S, 12, 12]} />
          </mesh>
          <pointLight position={[0, -0.56 * S, 0.02]} color="#FFC35C" intensity={0.5} distance={1.1} decay={1.6} />
        </group>
      </group>
    </group>
  );
}