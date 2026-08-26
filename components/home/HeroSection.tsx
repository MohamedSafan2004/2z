import Link from "next/link"
import { optimizeCloudinaryUrl } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

export function HeroSection() {
  return (
    <section className={styles["hero-section"]}>
      <img
        src={optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/hero.png", 1200)}
        srcSet={[500, 800, 1200, 1600].map((w) => `${optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/hero.png", w)} ${w}w`).join(", ")}
        alt="2Z Minimal Streetwear"
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        sizes="100vw"
        className={styles["hero-img"]}
      />

      <div className={styles["hero-overlay"]} />

      <div className={styles["hero-topbar"]}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "20px", height: "1px", background: "rgba(200,240,79,0.5)" }} />
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>
            Egypt · SS26
          </span>
        </div>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "22px", letterSpacing: "0.02em", color: "#f0ede6" }}>
          2Z
        </span>
      </div>

      <div className={styles["hero-content"]}>
        <h1 className={styles["hero-title"]}>
          2Z Next <br />
          Level
        </h1>

        <div className={styles["hero-divider"]} />

        <div className={styles["hero-bottom-row"]}>
          <p className={styles["hero-desc"]}>
            Oversized T-Shirts<br />
            Black · White · Grey · Beige
          </p>

          <Link href="/products" className={styles["shop-btn"]}>
            Shop Now
          </Link>
        </div>
      </div>

      <div className={styles["scroll-indicator"]}>
        <div className={styles["scroll-track"]}>
          <div className={styles["scroll-line"]} />
        </div>
      </div>
    </section>
  )
}
