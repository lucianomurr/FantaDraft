import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://fantadraft2027.vercel.app";
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/tool`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/fonti`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/termini`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
