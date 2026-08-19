import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { getActiveProducts } from "@/lib/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/ovos`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/ovos/${product.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
