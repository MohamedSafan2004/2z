import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const SITE_URL = "https://www.2zstore.com"

// بيتخزن لمدة ساعة — مفيش داعي يتحسب في كل request، المنتجات مش بتتغير كل دقيقة.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  let productPages: MetadataRoute.Sitemap = []

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, createdAt: true },
    })

    productPages = products.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch {
    // لو الداتابيز مش متاحة وقت البناء، السايت ماب لسه بيرجع الصفحات الثابتة على الأقل
    productPages = []
  }

  return [...staticPages, ...productPages]
}
