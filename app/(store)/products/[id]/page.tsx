import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import ProductDetailClient from "@/components/ProductDetailClient"

// بيتخزن لمدة 60 ثانية بدل force-dynamic — نفس السبب اللي في Home وProducts. الصفحة دي بتتفتح
// لكل منتج، وكانت بتعمل findUnique + findMany كاملين في *كل* زيارة بدون أي كاشينج.
export const revalidate = 60

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

  return <ProductDetailClient product={product} suggestedProducts={suggestedProducts} />
}