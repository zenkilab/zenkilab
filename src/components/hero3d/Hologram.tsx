"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useFloating } from "./hooks/useFloating";

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
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function Hologram({
  position = [-1.1, 0.2, 0.15],
  isMobile = false,
}: {
  position?: [number, number, number];
  isMobile?: boolean;
}) {
  const root = useFloating<THREE.Group>({
    amplitude: 0.035,
    speed: 0.55,
    phase: 1.2,
  });
  const gearGroup = useRef<THREE.Group>(null);

  const S = 0.52;
  const gearMaxThickness = 0.25 * S;

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

  const wireframe = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8FDDFB",
        wireframe: true,
        transparent: true,
        opacity: isMobile ? 0.12 : 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [isMobile],
  );
  const aura = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0e7490",
        transparent: true,
        opacity: isMobile ? 0.016 : 0.096,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [isMobile],
  );

  useFrame(({ clock }, delta) => {
    if (gearGroup.current) {
      if (isMobile) {
        // Mobile: slow random spin in both Y and X axes
        const t = clock.getElapsedTime();
        gearGroup.current.rotation.y += delta * 0.22;
        gearGroup.current.rotation.x = Math.sin(t * 0.45) * 0.18;
      } else {
        // Desktop: simple Y rotation only
        gearGroup.current.rotation.y += delta * 0.55;
        gearGroup.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.7) * 0.08;
      }
    }
  });

  return (
    <group ref={root} position={position}>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 40]} />
        <meshBasicMaterial
          color="#38C8F5"
          transparent
          opacity={isMobile ? 0.017 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, isMobile ? -0.1 : 0.18, 0]} rotation={isMobile ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={isMobile ? [0.5, 0.15, 1.2, 32, 1, true] : [0.45, 0.24, 0.5, 32, 1, true]} />
        <meshBasicMaterial
          color="#38C8F5"
          transparent
          opacity={isMobile ? 0.018 : 0.088}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <group
        ref={gearGroup}
        position={[0, 0.35, isMobile ? 2.0 : 0]}
        scale={isMobile ? 112.0 : 1.0}
        rotation={isMobile ? [-0.6, 0.6, 0] : undefined}
      >
        <group position={[-0.18 * S, 0, 0.05 * S]}>
          <mesh geometry={geoGear1} material={wireframe} />
          <mesh geometry={geoGear1} material={aura} scale={1.008} />
        </group>

        <group
          position={[0.26 * S, 0, 0.05 * S]}
          rotation={[0, Math.PI / 10, 0]}
        >
          <mesh geometry={geoGear2} material={wireframe} />
          <mesh geometry={geoGear2} material={aura} scale={1.008} />
        </group>

        <group position={[0.02 * S, 0, -0.29 * S]}>
          <mesh geometry={geoGear3} material={wireframe} />
          <mesh geometry={geoGear3} material={aura} scale={1.008} />
        </group>
      </group>

      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2.8, 0, 0]}>
        <torusGeometry args={[0.54, 0.006, 8, 48]} />
        <meshBasicMaterial
          color="#38C8F5"
          transparent
          opacity={isMobile ? 0.12 : 0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}