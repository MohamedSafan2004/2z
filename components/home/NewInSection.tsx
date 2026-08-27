import Link from "next/link"
import { Suspense } from "react"
import { RevealSection } from "@/components/RevealSection"
import { SkeletonBlock } from "@/components/Skeleton"
import { NewInScrollProgress } from "@/components/NewInScrollProgress"
import { getFeaturedProducts, colorImages, optimizeCloudinaryUrl } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

async function NewInContent() {
  const products = await getFeaturedProducts()
  if (products.length === 0) return null

  return (
    <div className={styles["newin-scroll-wrap"]}>
      <div className={styles["newin-grid"]} data-newin-grid>
        {products.map((p) => {
          const variant = p.variants?.[0]
          const color = variant?.color ?? "BLACK"
          const img = colorImages[color]
          const onSale = p.originalPrice && p.originalPrice > p.price
          return (
            <Link key={p.id} href={`/products/${p.id}`} className={`${styles["newin-item"]} ${styles["newin-cardlink"]}`}>
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", marginBottom: "10px" }}>
                {onSale && <span className={styles["card-sale-badge"]}>First Drop</span>}
                {img && (
                  <img
                    src={optimizeCloudinaryUrl(img, 400)}
                    alt={p.name}
                    className={styles["card-img"]}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                )}
              </div>
              {/* p.name أصلاً كامل في الداتابيز (زي "Oversize T-Shirt — Beige")،
                  فبنستخدمه زي ما هو من غير ما نضيف اللون تاني — ده كان باگ
                  التكرار ("Beige — Beige") اللي ظهر في صفحة Products */}
              <h3 className={styles["newin-name"]}>{p.name}</h3>
              <div className={styles["newin-meta-row"]}>
                <span className={styles["newin-cat"]}>T-Shirts</span>
                <span>
                  {onSale && <span className={styles["newin-orig"]}>{p.originalPrice} </span>}
                  <span className={styles["newin-price"]}>{p.price} EGP</span>
                </span>
              </div>
            </Link>
          )
        })}
      </div>
      <NewInScrollProgress trackClassName={styles["newin-progress-track"]} fillClassName={styles["newin-progress-fill"]} />
    </div>
  )
}

export function NewInSection() {
  return (
    <RevealSection className={styles.newin}>
      <div className={styles["sec-head"]}>
        <span className={styles["sec-label"]}>New In</span>
        <Link href="/products" className={styles["sec-viewall"]}>View All</Link>
      </div>
      <Suspense fallback={<SkeletonBlock height="280px" />}>
        <NewInContent />
      </Suspense>
    </RevealSection>
  )
}
