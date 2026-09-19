"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Phone
 * ─────
 * Procedural smartphone lying flat, facing up just under the hologram.
 * Screen displays "3D" and "PRINTING" in bright cyan.
 */
export function Phone({
  position = [0.5, -0.22, 0.15],
}: {
  position?: [number, number, number];
}) {
  const rootRef = useRef<THREE.Group>(null);

  const matBody = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1d24",
        metalness: 0.6,
        roughness: 0.3,
      }),
    [],
  );
  const matBezel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2e37",
        metalness: 0.9,
        roughness: 0.15,
      }),
    [],
  );

  const screenTex = useMemo(() => {
    const W = 512;
    const H = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Dark background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#020810");
    grad.addColorStop(0.5, "#061a28");
    grad.addColorStop(1, "#020810");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.strokeStyle = "rgba(56, 200, 245,0.04)";
    for (let y = 0; y < H; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const cx = W / 2;
    const fontSize = 96;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ── "3D" (top half) ──
    const y3d = H * 0.36;

    ctx.font = `bold ${fontSize}px 'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif`;
    ctx.shadowColor = "#38C8F5";
    ctx.shadowBlur = 80;
    ctx.fillStyle = "rgba(56, 200, 245,0.18)";
    ctx.fillText("3D", cx, y3d);
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#38C8F5";
    ctx.fillText("3D", cx, y3d);
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#8FDDFB";
    ctx.fillText("3D", cx, y3d);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e0f7ff";
    ctx.fillText("3D", cx, y3d);

    // ── "PRINTING" (bottom half) ──
    const yPrint = H * 0.68;

    ctx.font = `bold ${fontSize}px 'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif`;
    ctx.shadowColor = "#38C8F5";
    ctx.shadowBlur = 80;
    ctx.fillStyle = "rgba(56, 200, 245,0.18)";
    ctx.fillText("PRINTING", cx, yPrint);
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#38C8F5";
    ctx.fillText("PRINTING", cx, yPrint);
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#8FDDFB";
    ctx.fillText("PRINTING", cx, yPrint);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e0f7ff";
    ctx.fillText("PRINTING", cx, yPrint);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const matScreen = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: screenTex,
      }),
    [screenTex],
  );

  useFrame(({ clock }) => {
    if (rootRef.current) {
      rootRef.current.position.y =
        position[1] + Math.sin(clock.getElapsedTime() * 0.55) * 0.008;
    }
  });

  const pw = 0.55;
  const ph = 1.0;
  const pt = 0.06;
  const bezel = 0.03;

  return (
    <group ref={rootRef} position={position} rotation={[0.15, 0, 0]}>
      {/* Body */}
      <mesh material={matBody} castShadow receiveShadow>
        <boxGeometry args={[pw, pt, ph]} />
      </mesh>

      {/* Bezel */}
      <mesh position={[0, pt / 2 + 0.005, 0]} material={matBezel}>
        <boxGeometry args={[pw + 0.02, 0.008, ph + 0.02]} />
      </mesh>

      {/* Screen — canvas texture with "3D PRINTING" */}
      <mesh
        position={[0, pt / 2 + 0.012, 0]}
        material={matScreen}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[pw - bezel * 2, ph - bezel * 2]} />
      </mesh>

      {/* Screen glow overlay */}
      <mesh
        position={[0, pt / 2 + 0.014, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[pw - bezel * 2, ph - bezel * 2]} />
        <meshBasicMaterial
          color="#38C8F5"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Bottom edge accent */}
      <mesh position={[0, 0, -ph / 2]}>
        <boxGeometry args={[pw * 0.85, pt * 0.3, 0.012]} />
        <meshBasicMaterial
          color="#38C8F5"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}