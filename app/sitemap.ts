import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...["terms", "refund", "privacy"].map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
