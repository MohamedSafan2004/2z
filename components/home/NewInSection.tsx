import Link from "next/link"
import { Suspense } from "react"
import { RevealSection } from "@/components/RevealSection"
import { NewInScrollProgress } from "@/components/NewInScrollProgress"
import { SkeletonBlock } from "@/components/Skeleton"
import { getFeaturedProducts, optimizeCloudinaryUrl, colorImages } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

// جزء الداتابيز لوحده، بيسمح لباقي الصفحة إنها متستناش
async function NewInList() {
  const products = await getFeaturedProducts()

  return (
    <>
      {products.map((p, i) => {
        const color = p.variants?.[0]?.color || ""
        const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
        return (
          <RevealSection key={p.id} delay={i * 100} className={styles["newin-reveal-item"]}>
            <Link href={`/products/${p.id}`} className={`${styles["product-card"]} ${styles["newin-card"]}`} style={{ display: "block", textDecoration: "none", width: "100%" }}>
              <div style={{ aspectRatio: "3/4", width: "100%", position: "relative", overflow: "hidden", background: "#111" }}>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className={styles["card-sale-badge"]}>Sale</span>
                )}
                <img
                  src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 600)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className={styles["card-img"]}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.7) 10%, transparent 38%)" }} />
                <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                  <p className={styles["newin-name"]}>
                    Oversize T-Shirt<br />
                    <span style={{ color: "rgba(240,237,230,0.75)" }}>— {colorLabel}</span>
                  </p>
                  <div className={styles["newin-meta-row"]}>
                    <span className={styles["newin-cat"]}>T-Shirts</span>
                    <span aria-hidden="true"> </span>
                    {p.originalPrice && p.originalPrice > p.price ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span className={styles["newin-orig"]}>{p.originalPrice}</span>
                        <span className={styles["newin-price"]}>{p.price} EGP</span>
                      </span>
                    ) : (
                      <span className={styles["newin-price"]} style={{ color: "#f0ede6" }}>{p.price} EGP</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </RevealSection>
        )
      })}
    </>
  )
}

function NewInSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ aspectRatio: "3/4", width: "100%" }}>
          <SkeletonBlock height="100%" />
        </div>
      ))}
    </>
  )
}

export function NewInSection() {
  return (
    <section className={styles["newin-section"]}>
      <RevealSection>
        <div className={styles["newin-header"]}>
          <span className={styles["newin-label"]}>New In</span>
          <Link href="/products" className={styles["newin-viewall"]}>View All</Link>
        </div>
      </RevealSection>
      <div className={styles["newin-scroll-wrap"]}>
        <div className={styles["newin-grid"]} data-newin-grid>
          <Suspense fallback={<NewInSkeleton />}>
            <NewInList />
          </Suspense>
        </div>
      </div>
      <NewInScrollProgress
        trackClassName={styles["newin-progress-track"]}
        fillClassName={styles["newin-progress-fill"]}
      />
    </section>
  )
}
