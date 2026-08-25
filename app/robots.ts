import type { MetadataRoute } from "next"

const SITE_URL = "https://www.2zstore.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/checkout",
        "/cart",
        "/orders",
        "/login",
        "/register",
        "/verify",
        "/forgot-password",
        "/order-confirmed",
        "/instapay-payment",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
