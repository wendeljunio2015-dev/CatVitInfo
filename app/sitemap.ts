import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const baseUrl = "https://catvitinfo.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const productPages = products.map((product) => ({
    url: `${baseUrl}/produto/${product.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/produtos`, changeFrequency: "weekly", priority: 0.9 },
    ...productPages,
  ];
}
