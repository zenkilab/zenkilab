"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function noise(index: number, channel: number) {
  const value = Math.sin(index * 12.9898 + channel * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function useDrift(count: number, spread: [number, number, number]) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (noise(i, 0) - 0.5) * spread[0];
      positions[i * 3 + 1] = (noise(i, 1) - 0.5) * spread[1];
      positions[i * 3 + 2] = (noise(i, 2) - 0.5) * spread[2];
      speeds[i] = 0.02 + noise(i, 3) * 0.05;
    }
    return { positions, speeds };
  }, [count, spread]);
}

function AmbientDust() {
  const count = 140;
  const { positions, speeds } = useDrift(count, [6, 3.4, 3]);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i);
      let ny = y + speeds[i] * 0.01;
      if (ny > 1.8) ny = -1.8;
      posAttr.setY(i, ny);
      posAttr.setX(i, posAttr.getX(i) + Math.sin(t * 0.2 + i) * 0.0004);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#3B4656"
        size={0.012}
        sizeAttenuation
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

function HologramEmission({ origin, isMobile }: { origin: [number, number, number]; isMobile: boolean }) {
  const count = 60;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin[0] + (noise(i, 4) - 0.5) * 0.7;
      positions[i * 3 + 1] = origin[1] + (noise(i, 5) - 0.5) * 0.5;
      positions[i * 3 + 2] = origin[2] + (noise(i, 6) - 0.5) * 0.4;
      seeds[i * 2] = 0.15 + noise(i, 7) * 0.25;
      seeds[i * 2 + 1] = noise(i, 8) * Math.PI * 2;
    }
    return { positions, seeds };
  }, [origin, count]);

  useFrame(({ clock }, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const speed = seeds[i * 2];
      const phase = seeds[i * 2 + 1];
      let y = posAttr.getY(i) + speed * delta;
      if (y > origin[1] + 0.6) y = origin[1] - 0.3;
      posAttr.setY(i, y);
      posAttr.setX(i, origin[0] + Math.sin(t * 0.8 + phase) * 0.32);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8FDDFB"
        size={isMobile ? 0.014 : 0.02}
        sizeAttenuation
        transparent
        opacity={isMobile ? 0.75 : 0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function Particles({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <>
      <AmbientDust />
      <HologramEmission
        isMobile={isMobile}
        origin={isMobile ? [0, -0.55, 0.3] : [4.5, 0.35, -1.35]}
      />
    </>
  );
}