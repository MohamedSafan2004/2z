import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// ─────────────────────────────────────────────────────────────────────────
// Product Feed لـ Meta Catalog (Commerce Manager).
// بيتقرا مباشرة من الداتابيز في كل request، فأي تغيير في السعر أو الستوك
// أو تفعيل/تعطيل منتج بيبان في الفيد أوتوماتيك — Meta بتسحبه على فترات
// (كل 24 ساعة تقريبًا، أو ممكن تعمل "Fetch now" يدوي من Commerce Manager).
//
// عنوان الفيد اللي تحطه في Meta Commerce Manager:
//   https://www.2zstore.com/api/meta-feed
//
// كل ProductVariant (لون + مقاس) بيتحول لـ item منفصل بالـ SKU بتاعه،
// عشان الـ availability تبقى دقيقة على مستوى الـ variant مش المنتج ككل.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic"

const SITE_URL = "https://www.2zstore.com"

// نفس الصور المستخدمة في ProductDetailClient — صورة واحدة تمثيلية لكل لون
const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
}

function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

function colorLabel(color: string): string {
  return color.charAt(0) + color.slice(1).toLowerCase()
}

// XML لازم يهرب الرموز الخاصة (& < > " ') أو الفيد يبقى invalid
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const items: string[] = []

    for (const product of products) {
      // منتجات لسه من غير سعر أو variants متجهزة — استبعدها من الفيد
      if (!product.variants.length) continue

      for (const variant of product.variants) {
        const sku = variant.sku || `2Z-TEE-${variant.color.slice(0, 1)}-${variant.size}`
        const availability = variant.stockQuantity > 0 ? "in stock" : "out of stock"
        const price = Number(product.price)
        const originalPrice = product.originalPrice ? Number(product.originalPrice) : null
        const hasSale = originalPrice && originalPrice > price

        const title = `${product.name} — ${colorLabel(variant.color)} / ${variant.size}`
        const description = product.description
          ? product.description
          : `${product.name} in ${colorLabel(variant.color)}, size ${variant.size}. Minimal Egyptian streetwear by 2Z Store.`

        const imageUrl = optimizeCloudinaryUrl(
          colorImages[variant.color] || colorImages.BLACK,
          1000
        )

        const link = `${SITE_URL}/products/${product.id}`

        items.push(`
    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${(hasSale ? originalPrice! : price).toFixed(2)} EGP</g:price>
      ${hasSale ? `<g:sale_price>${price.toFixed(2)} EGP</g:sale_price>` : ""}
      <g:brand>2Z Store</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(product.category?.name || "Apparel")}</g:product_type>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category>
      <g:color>${escapeXml(colorLabel(variant.color))}</g:color>
      <g:size>${escapeXml(variant.size)}</g:size>
      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>
      <g:fb_product_category>1604</g:fb_product_category>
    </item>`)
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>2Z Store Product Feed</title>
    <link>${SITE_URL}</link>
    <description>2Z Store — Minimal Egyptian Streetwear</description>${items.join("")}
  </channel>
</rss>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // كاش بسيط لمدة ساعة عشان مانحملش الداتابيز على كل سحب من Meta
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Meta feed generation error:", error)
    return new NextResponse("<?xml version=\"1.0\"?><error>Feed generation failed</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    })
  }
}