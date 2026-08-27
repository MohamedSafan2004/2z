import Link from "next/link"
import { Suspense } from "react"
import { RevealSection } from "@/components/RevealSection"
import { SkeletonBlock } from "@/components/Skeleton"
import { getBestSellers, colorImages, optimizeCloudinaryUrl } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

// كارت نضيف: صورة full-bleed + اسم/سعر تحتها بس. مفيش بوردر، مفيش تاج
// ملون، مفيش خلفية شفافة — نفس منطق المتاجر الحقيقية (Galvano وغيره):
// الصورة نفسها هي اللي بتتكلم، الـ UI بيدعمها مش بيزاحمها.
async function BestSellersContent() {
  const products = await getBestSellers()
  if (products.length === 0) return null

  return (
    <div className={styles["bs-grid"]}>
      {products.map((p) => {
        const variant = p.variants?.[0]
        const color = variant?.color ?? "BLACK"
        const img = colorImages[color]
        return (
          <Link key={p.id} href={`/products/${p.id}`} className={styles["bs-card"]}>
            <div className={styles["bs-imgwrap"]}>
              <span className={styles["bs-badge"]}>Best Seller</span>
              {img && (
                <img
                  src={optimizeCloudinaryUrl(img, 500)}
                  alt={p.name}
                  className={`${styles["bs-img"]} ${styles["card-img"]}`}
                  loading="lazy"
                />
              )}
            </div>
            <div className={styles["bs-info"]}>
              {/* p.name أصلاً كامل ("Oversize T-Shirt — Black")، من غير ما نضيف
                  اللون تاني — نفس إصلاح باگ التكرار اللي كان في صفحة Products */}
              <h3 className={styles["bs-name"]}>{p.name}</h3>
              <div className={styles["bs-meta"]}>
                <span className={styles["bs-cat"]}>T-Shirts</span>
                <span>
                  {p.originalPrice && <span className={styles["bs-orig"]}>{p.originalPrice} </span>}
                  <span className={styles["bs-price"]}>{p.price} EGP</span>
                </span>
              </div>
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
