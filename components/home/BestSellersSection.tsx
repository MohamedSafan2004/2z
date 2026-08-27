import Link from "next/link"
import { Suspense } from "react"
import { RevealSection } from "@/components/RevealSection"
import { SkeletonBlock } from "@/components/Skeleton"
import { getBestSellers, colorImages, optimizeCloudinaryUrl } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

// كارت مبسّط زي المتاجر الحقيقية (Galvano وغيره): صورة نضيفة + اسم + سعر
// بس. مفيش تصنيف "T-Shirts" تحت كل كارت (زيادة مالهاش داعي، المنتجات كلها
// تيشيرتات أصلاً)، مفيش تاج ملون، مفيش badge غير Sold Out لو حصل.
async function BestSellersContent() {
  const products = await getBestSellers()
  if (products.length === 0) return null

  return (
    <div className={styles["bs-grid"]}>
      {products.map((p) => {
        const variant = p.variants?.[0]
        const color = variant?.color ?? "BLACK"
        const img = colorImages[color]
        const isSoldOut = p.variants?.length > 0 && p.variants.every((v) => v.stockQuantity === 0)
        return (
          <Link key={p.id} href={`/products/${p.id}`} className={styles["bs-card"]}>
            <div className={styles["bs-imgwrap"]}>
              {isSoldOut && <span className={styles["bs-badge"]}>Sold Out</span>}
              {img && (
                <img
                  src={optimizeCloudinaryUrl(img, 500)}
                  alt={p.name}
                  className={`${styles["bs-img"]} ${styles["card-img"]}`}
                  style={{ opacity: isSoldOut ? 0.45 : 1 }}
                  loading="lazy"
                />
              )}
            </div>
            <div className={styles["bs-info"]}>
              <h3 className={styles["bs-name"]}>{p.name}</h3>
              {p.originalPrice ? (
                <span className={styles["bs-price-row"]}>
                  <span className={styles["bs-orig"]}>{p.originalPrice}</span>
                  <span className={styles["bs-price"]}>{p.price} EGP</span>
                </span>
              ) : (
                <span className={styles["bs-price"]}>{p.price} EGP</span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function BestSellersSection() {
  return (
    <RevealSection className={styles.bestsellers}>
      <div className={styles["sec-head"]}>
        <span className={styles["sec-label"]}>Best Sellers</span>
        <Link href="/products" className={styles["sec-viewall"]}>View All</Link>
      </div>
      <Suspense fallback={<SkeletonBlock height="360px" />}>
        <BestSellersContent />
      </Suspense>
    </RevealSection>
  )
}
