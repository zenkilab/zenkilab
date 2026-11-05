"use client";

import { Background } from "@/components/hero3d/Background";
import { HeroText } from "@/components/hero3d/HeroText";
import { GearboxFigure } from "./GearboxFigure";

/** The hero with the Hairline gearbox in place of the Three.js scene: same copy, same CTAs, same backdrop. */
export function GearboxHero({ onStart }: { onStart: () => void }) {
  return (
    <>
      <Background />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="mt-[6vh] lg:col-span-5 lg:mt-0">
            <HeroText onStart={onStart} />
          </div>
          <div className="mx-auto w-full max-w-[560px] lg:col-span-7 lg:max-w-none">
            <GearboxFigure />
          </div>
        </div>
      </div>
    </>
  );
}
