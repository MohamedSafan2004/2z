import type { Metadata } from "next"
import "./globals.css"
import Providers from "./providers"
import MetaPixel from "@/components/MetaPixel"

export const metadata: Metadata = {
  title: "2Z Store",
  description: "Minimal Streetwear",
icons: {
  icon: "/favicon.ico",
},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MetaPixel />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}