"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Product page shell (DESIGN_SYSTEM.md section 4): one large hero image on one side,
 * purchase panel on the other, no thumbnail rail.
 */
export function ProductLayout({
  image,
  alt,
  focus,
  children,
}: {
  image: string;
  alt: string;
  focus?: string;
  children: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-28 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
          <div
            className="relative w-full overflow-hidden rounded-2xl lg:sticky lg:top-28"
            style={{ aspectRatio: "4 / 5", backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
          >
            {failed ? (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                The photo could not be loaded.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={alt}
                width={1080}
                height={1616}
                fetchPriority="high"
                onError={() => setFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: focus }}
              />
            )}
          </div>
          <div className="lg:py-6">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
