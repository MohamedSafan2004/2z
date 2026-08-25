import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import ProductDetailClient from "@/components/ProductDetailClient"

// بيتخزن لمدة 60 ثانية بدل force-dynamic — نفس السبب اللي في Home وProducts. الصفحة دي بتتفتح
// لكل منتج، وكانت بتعمل findUnique + findMany كاملين في *كل* زيارة بدون أي كاشينج.
export const revalidate = 60

const SITE_URL = "https://www.2zstore.com"

// نفس الصور المستخدمة في باقي الموقع (Home + meta-feed) — صورة واحدة تمثيلية لكل لون
const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992648/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992648/2z-store/tee-white.jpg",
  GREY: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992649/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992650/2z-store/tee-beige.jpg",
}

function colorLabel(color: string): string {
  return color.charAt(0) + color.slice(1).toLowerCase()
}

// generateMetadata بتشتغل server-side زي الـ page نفسها، ومعندهاش تكلفة إضافية
// حقيقية — Next.js بيدمجها مع نفس الـ request cycle، والـ query هنا خفيف جداً
// (findUnique بحقول محدودة فقط).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const product = await db.product.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      price: true,
      isActive: true,
      variants: { select: { color: true }, take: 1 },
    },
  })

  if (!product || !product.isActive) {
    return { title: "Product Not Found — 2Z Store" }
  }

  const color = product.variants[0]?.color || "BLACK"
  const image = colorImages[color] || colorImages.BLACK
  const title = `${product.name} — ${colorLabel(color)} | 2Z Store`
  const description =
    product.description?.trim() ||
    `${product.name} in ${colorLabel(color)}. Oversized boxy fit, 100% premium interlock cotton, double-sided construction. Designed & made in Cairo, Egypt.`
  const url = `${SITE_URL}/products/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "2Z Store",
      images: [{ url: image, width: 1200, height: 1200, alt: title }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      variants: {
        select: { id: true, color: true, size: true, stockQuantity: true },
      },
    },
  })

  if (!product || !product.isActive) return null

  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSuggestedProducts(currentId: string, currentCategoryId: string) {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: currentId },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: { id: true, color: true, size: true, stockQuantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return products
    .filter((p) => p.category?.slug !== "sweatpants")
    .map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }))
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const suggestedProducts = await getSuggestedProducts(id, product.categoryId)

  // Product schema (JSON-LD) — مبني على نفس الـ product اللي اتجاب فعليًا فوق، مفيش أي query إضافي.
  // دي اللي بتخلي جوجل يعرض السعر والتوفر (in stock / out of stock) جنب اللينك في نتائج البحث.
  const primaryColor = product.variants[0]?.color || "BLACK"
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
  const productImage = colorImages[primaryColor] || colorImages.BLACK

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description?.trim() ||
      `${product.name} in ${colorLabel(primaryColor)}. Oversized boxy fit, 100% premium interlock cotton, double-sided construction. Designed & made in Cairo, Egypt.`,
    image: [productImage],
    brand: { "@type": "Brand", name: "2Z Store" },
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: "EGP",
      price: product.price.toFixed(2),
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient product={product} suggestedProducts={suggestedProducts} />
    </>
  )
}