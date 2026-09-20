"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Slideshow, type Slide } from "@/components/ui/slideshow";
import { DepthRings } from "./depth-rings";

/**
 * Product page shell (DESIGN_SYSTEM.md section 4): one large hero on one side, purchase panel
 * on the other, no thumbnail rail. The hero is a few subject-cropped photos that change every
 * three seconds, with the brand rings turning slowly behind it as the page scrolls.
 */
export function ProductLayout({
  slides,
  children,
}: {
  slides: Slide[];
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const ringA = useTransform(scrollY, [0, 1400], [0, 70]);
  const ringB = useTransform(scrollY, [0, 1400], [0, -100]);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-28 pt-28 lg:px-8 lg:pt-32">
        <Link href="/store" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Store
        </Link>
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
          <div className="relative lg:sticky lg:top-28">
            <DepthRings outer={reduce ? undefined : ringA} inner={reduce ? undefined : ringB} className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 lg:block" />
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <Slideshow slides={slides} aspect="4 / 5" />
            </motion.div>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:py-4"
          >
            {children}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
