"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Phone
 * ─────
 * Procedural smartphone lying flat, facing up just under the hologram.
 * Graphite frame with an amber power key, a black glass face, and a screen drawn in the
 * site's own type and palette: white Space Grotesk on near-black, cyan where it feeds the
 * hologram, an amber progress bar. Size, position and float are unchanged.
 */

/** Rounded rectangle in the XY plane, centred on the origin. */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Flat rounded plate lying in the XZ plane, with UVs mapped 0..1 so it can carry a texture. */
function plate(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 12);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  g.rotateX(-Math.PI / 2);
  return g;
}

const cssVar = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

function drawScreen(canvas: HTMLCanvasElement) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  const display = cssVar("--font-wordmark", "sans-serif");
  const body = cssVar("--font-inter", "sans-serif");
  const mono = cssVar("--font-plex-mono", "monospace");

  // Glass: near-black with a faint surface lift in the middle
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0B0D10");
  bg.addColorStop(0.55, "#12151A");
  bg.addColorStop(1, "#0B0D10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft cyan bloom behind the hologram feed
  const bloom = ctx.createRadialGradient(W / 2, H * 0.44, 10, W / 2, H * 0.44, W * 0.75);
  bloom.addColorStop(0, "rgba(56, 200, 245, 0.20)");
  bloom.addColorStop(1, "rgba(56, 200, 245, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // Dynamic island
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 56, 30, 112, 32, 16);
  ctx.fill();

  // Status bar
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#F3F5F7";
  ctx.font = `600 26px ${body}`;
  ctx.fillText("9:41", 44, 46);
  ctx.textAlign = "right";
  ctx.beginPath();
  ctx.roundRect(W - 92, 38, 46, 22, 6);
  ctx.strokeStyle = "rgba(243,245,247,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#F3F5F7";
  ctx.beginPath();
  ctx.roundRect(W - 89, 41, 32, 16, 4);
  ctx.fill();

  // "3D" with a cyan glow, the same colour the hologram uses
  ctx.textAlign = "center";
  const cx = W / 2;
  const y3d = H * 0.4;
  ctx.font = `700 210px ${display}`;
  ctx.shadowColor = "#38C8F5";
  ctx.shadowBlur = 70;
  ctx.fillStyle = "rgba(56, 200, 245, 0.35)";
  ctx.fillText("3D", cx, y3d);
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#8FDDFB";
  ctx.fillText("3D", cx, y3d);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#F3F5F7";
  ctx.fillText("3D", cx, y3d);

  // "PRINTING" in the wordmark face
  ctx.font = `600 66px ${display}`;
  ctx.fillStyle = "#F3F5F7";
  ctx.fillText("PRINTING", cx, H * 0.585);

  // Amber progress: light to base
  const bx = 76;
  const bw = W - bx * 2;
  const by = H * 0.655;
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 10, 5);
  ctx.fill();
  const fill = ctx.createLinearGradient(bx, 0, bx + bw * 0.62, 0);
  fill.addColorStop(0, "#FFC35C");
  fill.addColorStop(1, "#F5A623");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw * 0.62, 10, 5);
  ctx.fill();

  ctx.font = `500 24px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F5A623";
  ctx.fillText("62%", bx, by + 40);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8A93A0";
  ctx.fillText("PETG", bx + bw, by + 40);

  // Home indicator
  ctx.fillStyle = "rgba(243,245,247,0.4)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 68, H - 30, 136, 7, 4);
  ctx.fill();
}

export function Phone({
  position = [0.5, -0.22, 0.15],
}: {
  position?: [number, number, number];
}) {
  const rootRef = useRef<THREE.Group>(null);

  const pw = 0.55;
  const ph = 1.0;
  const pt = 0.06;
  const bezel = 0.03;

  const matFrame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3A3F48", metalness: 0.95, roughness: 0.28 }), []);
  const matKey = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F5A623", metalness: 0.9, roughness: 0.3 }), []);
  const matGlass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#050608", metalness: 0.2, roughness: 0.08 }), []);

  const frameGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(pw + 0.02, ph + 0.02, 0.08), {
      depth: pt,
      bevelEnabled: true,
      bevelThickness: 0.007,
      bevelSize: 0.007,
      bevelSegments: 4,
      curveSegments: 14,
    });
    g.translate(0, 0, -pt / 2);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const glassGeo = useMemo(() => plate(pw, ph, 0.07), []);
  const screenGeo = useMemo(() => plate(pw - bezel * 2, ph - bezel * 2, 0.045), []);

  const screenTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    drawScreen(canvas);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  // Fonts load after first paint, so draw again once they are ready.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      drawScreen(screenTex.image as HTMLCanvasElement);
      screenTex.needsUpdate = true;
    });
    return () => {
      alive = false;
    };
  }, [screenTex]);

  // Diagonal glass reflection across the screen
  const sheenTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 64, 128);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.38, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.16)");
    g.addColorStop(0.62, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    if (rootRef.current) {
      rootRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.55) * 0.008;
    }
  });

  return (
    <group ref={rootRef} position={position} rotation={[0.15, 0, 0]}>
      {/* Frame */}
      <mesh geometry={frameGeo} material={matFrame} castShadow receiveShadow />

      {/* Side keys: amber power on the right, two graphite volume keys on the left */}
      <RoundedBox args={[0.014, 0.024, 0.11]} radius={0.006} smoothness={2} position={[pw / 2 + 0.012, 0, -0.14]} material={matKey} />
      <RoundedBox args={[0.014, 0.024, 0.07]} radius={0.006} smoothness={2} position={[-pw / 2 - 0.012, 0, -0.22]} material={matFrame} />
      <RoundedBox args={[0.014, 0.024, 0.07]} radius={0.006} smoothness={2} position={[-pw / 2 - 0.012, 0, -0.08]} material={matFrame} />

      {/* Black glass */}
      <mesh geometry={glassGeo} material={matGlass} position={[0, pt / 2 + 0.009, 0]} />

      {/* Screen */}
      <mesh geometry={screenGeo} position={[0, pt / 2 + 0.0115, 0]}>
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>

      {/* Glass sheen */}
      <mesh geometry={screenGeo} position={[0, pt / 2 + 0.0135, 0]}>
        <meshBasicMaterial map={sheenTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Edge accent where the hologram beam meets the phone */}
      <mesh position={[0, 0, -ph / 2]}>
        <boxGeometry args={[pw * 0.85, pt * 0.3, 0.012]} />
        <meshBasicMaterial color="#38C8F5" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
