import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bootkit.in",
      priority: 1,
    },
    {
      url: "https://bootkit.in/about",
    },
    {
      url: "https://bootkit.in/contact",
    },
    {
      url: "https://bootkit.in/privacy-policy",
    },
    {
      url: "https://bootkit.in/terms",
    },
  ];
}