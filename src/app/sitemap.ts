import type { MetadataRoute } from "next";

const SITE_URL = "https://zenith-studio.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Section anchors are surfaced so Google can offer jump-to-section links
    // in the result snippet.
    { url: `${SITE_URL}/#systems`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/#services`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/#work`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/#products`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/#faq`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    // Zenith Lab has its own route so it can rank for course-related searches.
    { url: `${SITE_URL}/lab`, lastModified, changeFrequency: "weekly", priority: 0.9 },
  ];
}
