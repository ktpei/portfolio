import type { MetadataRoute } from "next";
import { site } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/board`, changeFrequency: "daily", priority: 0.8 },
    {
      url: site.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
