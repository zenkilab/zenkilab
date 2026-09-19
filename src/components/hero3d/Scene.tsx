"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Group } from "three";
import { Printer } from "./Printer";
import { Phone } from "./Phone";
import { Hologram } from "./Hologram";
import { Particles } from "./Particles";
import { useMouseParallax } from "./hooks/useMouseParallax";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * CameraRig
 * ─────────
 * Mobile: interpolates camera from steep top-down (0 % scroll)
 *         to low bed-level POV (100 % scroll).
 * Desktop: unchanged ¾ front-right perspective.
 */
function CameraRig({
  mouse,
  isMobile,
  mobileScrollProgress = 0,
  renderOnly,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
  isMobile: boolean;
  mobileScrollProgress?: number;
  renderOnly?: string;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!isMobile) {
      // ── Desktop: unchanged ──
      const targetX = 4.1 + mouse.current.x * 0.2;
      const targetY = 3.0 + mouse.current.y * -0.1;
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.lookAt(4.0, 0.35, -0.58);
      return;
    }

    const p = mobileScrollProgress;

    if (renderOnly === "phone-hologram") {
      // Mobile phone/hologram canvas: camera flies past hologram gear (3D dolly effect)
      const camY = 3.2 + p * -2.9;   // 3.2 → 0.3  (drops past gear at Y:0.35)
      const camZ = 3.5 + p * -2.0;   // 3.5 → 1.5  (passes gear at Z:2.0)
      const lookY = 0.5 + p * -1.3;  // 0.5 → -0.8 (ends looking at phone)
      const lookZ = 0.0;

      const targetX = 0 + mouse.current.x * 0.06;
      const targetY = camY + mouse.current.y * -0.03;

      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.position.z += (camZ - camera.position.z) * 0.04;
      camera.lookAt(0, lookY, lookZ);
    } else {
      // Mobile printer canvas: top-down → bed-level descent
      const camY = 3.2 + p * -2.9;
      const camZ = 5.0 + p * -1.6;
      const lookY = 2.0 + p * -2.2;
      const lookZ = 0.0 + p * 0.6;

      const targetX = 0 + mouse.current.x * 0.06;
      const targetY = camY + mouse.current.y * -0.03;

      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.position.z += (camZ - camera.position.z) * 0.04;
      camera.lookAt(0, lookY, lookZ);
    }
  });

  return null;
}

function ScrollRig({ sceneRoot }: { sceneRoot: React.RefObject<Group | null> }) {
  useEffect(() => {
    if (!sceneRoot.current) return;
    const el = sceneRoot.current;

    const trigger = ScrollTrigger.create({
      trigger: "#home",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        el.rotation.y = self.progress * 0.45;
        const s = 1 + self.progress * 0.1;
        el.scale.set(s, s, s);
      },
    });

    return () => trigger.kill();
  }, [sceneRoot]);

  return null;
}

export function Scene({
  renderOnly,
  mobileScrollProgress = 0,
}: {
  renderOnly?: "phone-hologram" | "printer";
  mobileScrollProgress?: number;
}) {
  const mouse = useMouseParallax();
  const sceneRoot = useRef<Group>(null);
  const isMobile = typeof renderOnly !== "undefined";

  return (
    <Canvas
      dpr={isMobile ? 1 : [1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        localClippingEnabled: true,
      }}
      style={
        isMobile ? { pointerEvents: "none" as any } : undefined
      }
      camera={
        isMobile
          ? { position: [0, 3.2, 5.0], fov: 52 }
          : { position: [4.1, 3.0, 5.5], fov: 42 }
      }
      frameloop="always"
    >
      {/* Neutral-toned ambient fill — subtle, cool-charcoal */}
      <ambientLight intensity={0.28} color="#2A2E35" />
      {/* Key light — soft white for definition */}
      <directionalLight position={[3, 4, 3]} intensity={0.55} color="#EAEBEC" />
      {/* Amber accent point lights, matching the amber-primary materials. The hologram uses unlit MeshBasicMaterial, so it stays cyan on purpose. */}
      <pointLight position={[-2, 1.5, 2]} intensity={1.0} color="#F5A623" distance={7} />
      <pointLight position={[2, -0.5, 1.8]} intensity={0.7} color="#F5A623" distance={6} />
      <pointLight position={[0, -1, 1]} intensity={0.6} color="#F5A623" distance={5} />

      {(!renderOnly || renderOnly === "printer") && (
        <>
          <pointLight
            position={isMobile ? [0, 3.0, 0] : [6.0, 2.5, -1.08]}
            intensity={isMobile ? 2.8 : 1.3}
            color="#F5F0EB"
            distance={isMobile ? 8 : 8}
            decay={1.2}
          />
          <pointLight
            position={isMobile ? [2.0, -0.5, 0] : [8.5, -0.5, -1.08]}
            intensity={isMobile ? 1.6 : 1.0}
            color="#F0EDE8"
            distance={6}
            decay={1.2}
          />
          {!isMobile && (
            <pointLight
              position={[7.2, 0.35, 0.25]}
              intensity={0.55}
              color="#F2EFEA"
              distance={6.5}
              decay={1.3}
            />
          )}
        </>
      )}

      <group ref={sceneRoot}>
        <group rotation={isMobile ? undefined : [0, -10 * (Math.PI / 180), 0]}>
          {(!renderOnly || renderOnly === "printer") && (
            <group scale={isMobile ? 0.8 : 1}>
              <Printer
                mouse={mouse}
                position={isMobile ? [0, -1.2, 0] : [6.0, -0.72, -1.08]}
              />
            </group>
          )}

          {(!renderOnly || renderOnly === "phone-hologram") && (
            <group scale={isMobile ? 0.85 : 1}>
              <Phone position={isMobile ? [0, -0.8, 0] : [4.5, -0.22, -1.35]} />
              <Hologram position={isMobile ? [0, 0.3, 0] : [4.5, 0.2, -1.35]} />
              <Particles isMobile={isMobile} />
            </group>
          )}
        </group>
      </group>

      <CameraRig mouse={mouse} isMobile={isMobile} mobileScrollProgress={mobileScrollProgress} renderOnly={renderOnly} />
      <ScrollRig sceneRoot={sceneRoot} />

      {/* Mobile skips Bloom, the biggest post-processing cost. Vignette stays. */}
      {isMobile ? (
        <EffectComposer multisampling={0}>
          <Vignette eskil={false} offset={0.15} darkness={0.65} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.35} luminanceSmoothing={0.25} mipmapBlur radius={0.5} />
          <Vignette eskil={false} offset={0.15} darkness={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  );
}