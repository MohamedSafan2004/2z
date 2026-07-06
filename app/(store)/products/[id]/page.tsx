import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import ProductDetailClient from "@/components/ProductDetailClient"

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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  return <ProductDetailClient product={product} />
}