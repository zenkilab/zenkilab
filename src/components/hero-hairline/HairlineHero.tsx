"use client";

import { Background } from "@/components/hero3d/Background";
import { HeroText } from "@/components/hero3d/HeroText";
import { HairlineFigure } from "./HairlineFigure";
import { CYCLE, HERO_SCENE } from "./hero";
import type { Drive } from "./render";

/** How far the hero has scrolled away: 0 in place, 1 once its section has left the top of the screen. */
const drive = (stage: HTMLElement): Drive => {
  const section = stage.closest("section");
  return {
    mode: "loop",
    cycle: CYCLE,
    leaving: () => (section ? -section.getBoundingClientRect().top / section.offsetHeight : 0),
  };
};

/** The hero with the Hairline print queue in place of the Three.js scene: same copy, same CTAs, same backdrop. */
export function HairlineHero({ onStart }: { onStart: () => void }) {
  return (
    <>
      <Background />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="mt-[6vh] lg:col-span-5 lg:mt-0">
            <HeroText onStart={onStart} />
          </div>
          <HairlineFigure
            scene={HERO_SCENE}
            drive={drive}
            className="mx-auto w-full max-w-[560px] lg:col-span-7 lg:max-w-none"
            label="Line drawing of Zenki Lab's print queue: customer 3D files and Zenki store products arrive as meshes, are sliced, printed layer by layer, and set on a tray of finished parts; a printed gearbox gets its gears fitted and turning."
          />
        </div>
      </div>
    </>
  );
}
