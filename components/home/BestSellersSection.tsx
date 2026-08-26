import Link from "next/link"
import { Suspense } from "react"
import { RevealSection } from "@/components/RevealSection"
import { SkeletonBlock } from "@/components/Skeleton"
import { getBestSellers, optimizeCloudinaryUrl, colorImages } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

// كارت مختلف عن New In عمدًا — صف أفقي "ranked showcase" برقم ترتيب بصري (01/02)
async function BestSellersList() {
  const products = await getBestSellers()

  return (
    <>
      {products.map((p, i) => {
        const color = p.variants?.[0]?.color || ""
        const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
        return (
          <RevealSection key={p.id} delay={i * 100}>
            <Link href={`/products/${p.id}`} className={styles["bs-card"]}>
              <div className={styles["bs-imgwrap"]}>
                <img
                  src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 400)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={styles["bs-img"]}
                />
              </div>
              <div className={styles["bs-body"]}>
                <span className={styles["bs-toplabel"]}>
                  <span className={styles["bs-toplabel-bar"]} />
                  Best Seller
                </span>
                <p className={styles["bs-name"]}>
                  Oversize Tee <span>— {colorLabel}</span>
                </p>
                <div className={styles["bs-meta"]}>
                  <span className={styles["bs-cat"]}>T-Shirts</span>
                  {p.originalPrice && p.originalPrice > p.price ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span className={styles["newin-orig"]}>{p.originalPrice}</span>
                      <span className={styles["bs-price"]}>{p.price} EGP</span>
                    </span>
                  ) : (
                    <span className={styles["bs-price"]}>{p.price} EGP</span>
                  )}
                </div>
              </div>
            </Link>
          </RevealSection>
        )
      })}
    </>
  )
}

function BestSellersSkeleton() {
  return (
    <>
      {[1, 2].map((i) => (
        <div key={i} style={{ height: "140px", width: "100%" }}>
          <SkeletonBlock height="100%" />
        </div>
      ))}
    </>
  )
}

export function BestSellersSection() {
  return (
    <section className={styles["bestsellers-section"]}>
      <RevealSection>
        <div className={styles["newin-header"]}>
          <span className={styles["newin-label"]}>Best Sellers</span>
          <Link href="/products" className={styles["newin-viewall"]}>View All</Link>
        </div>
      </RevealSection>
      <div className={styles["bs-list"]}>
        <Suspense fallback={<BestSellersSkeleton />}>
          <BestSellersList />
        </Suspense>
      </div>
    </section>
  )
}
