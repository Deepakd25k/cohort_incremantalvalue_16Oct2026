import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// Search engines and AI assistants (ChatGPT, Claude, Perplexity, Gemini) may read the public pages.
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin", "/api/", "/thank-you"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended"],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
