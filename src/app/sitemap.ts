import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = "https://zenkilab.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // ponytail: bump when the page content really changes; a fresh Date() every build makes Google ignore lastmod.
  const now = new Date("2026-10-03");
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/store`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/store/key-tag`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/store/chibi-figure`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
