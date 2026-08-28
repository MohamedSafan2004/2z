import type { Metadata } from "next"
import { Space_Mono, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import Providers from "./providers"
import MetaPixel from "@/components/MetaPixel"
import Clarity from "@/components/Clarity"

// next/font/google بدل @import url(...) اللي كانت في globals.css: الـ @import بيخلي
// المتصفح مضطر يستنى fonts.googleapis.com يخلص تحميله بالكامل (DNS +
// TLS + download لسيرفر خارجي تمامًا) قبل ما يقدر يطبق أي CSS تاني جوه نفس الملف
// (زي Tailwind) — ده رندر-بلوكينج موثق وموجود في تقرير الـ Lighthouse. next/font/google
// بيعمل self-host للخطوط وقت الـ build (بيحملهم مرة واحدة ويخزنهم كملفات جوه
// 2zstore.com نفسه)، فالمتصفح مش محتاج يعمل أي طلب خارجي خالص للخطوط، ومعاها
// Next.js بيحقن preload + font-display: swap تلقائيًا.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-space-mono",
  display: "swap",
})
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const SITE_URL = "https://www.2zstore.com"
const DEFAULT_TITLE = "2Z Store — Oversized Minimal Streetwear | Egypt"
const DEFAULT_DESCRIPTION =
  "2Z Store — Egyptian minimal streetwear brand. Oversized T-Shirts in Black, White, Grey & Beige. Shipping across Egypt."
const OG_IMAGE =
  "https://res.cloudinary.com/ghetnovd/image/upload/v1782992648/2z-store/tee-black.jpg"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | 2Z Store",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "2Z Store",
    "streetwear Egypt",
    "oversized t-shirt Egypt",
    "Egyptian streetwear brand",
    "minimal streetwear",
    "ملابس ستريتوير مصر",
    "تي شيرت أوفرسايز",
  ],
  authors: [{ name: "2Z Store" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "2Z Store",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 1200, alt: "2Z Store" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
}

// Organization schema ثابت للموقع كله — script tag عادي JSON مفيش أي تأثير على الـ render
// أو الـ performance. بيساعد جوجل يفهم البراند ويظهر لوجو أوضح في نتائج البحث.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "2Z Store",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description: DEFAULT_DESCRIPTION,
  sameAs: [
    "https://www.facebook.com/share/197mwFDfCc/?mibextid=wwXIfr",
    "https://www.instagram.com/2z.official/",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "2z.eg2004@gmail.com",
    areaServed: "EG",
    availableLanguage: ["en", "ar"],
  },
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "2Z Store",
  url: SITE_URL,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${cormorantGaramond.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <MetaPixel />
        <Clarity />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}