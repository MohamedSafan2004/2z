import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "2Z Store — Oversized Minimal Streetwear",
    short_name: "2Z Store",
    description:
      "2Z Store — Egyptian minimal streetwear brand. Oversized T-Shirts in Black, White, Grey & Beige.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  }
}
