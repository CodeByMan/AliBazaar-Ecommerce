import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();
  const staticRoutes = [
    "",
    "/shop-with-sidebar",
    "/contact",
    "/signin",
    "/signup",
    "/track-order",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
    priority: path === "" ? 1 : path === "/shop-with-sidebar" ? 0.9 : 0.6,
  }));

  try {
    const { products, categories } = await getProducts();
    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: `${siteUrl}/shop-with-sidebar?category=${encodeURIComponent(category)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: `${siteUrl}/shop-details?id=${product.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: product.imgs.previews,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
