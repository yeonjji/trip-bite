import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trip-bite.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["ko", "en"];
  const now = new Date();

  const staticPaths = [
    "",
    "/travel",
    "/restaurants",
    "/camping",
    "/specialties",
    "/recipes",
    "/search",
    "/about",
    "/privacy",
    "/terms",
  ];

  const staticUrls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      staticUrls.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
          ),
        },
      });
    }
  }

  return staticUrls;
}
