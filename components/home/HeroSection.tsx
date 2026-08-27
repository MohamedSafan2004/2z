import Link from "next/link"
import styles from "../../app/(store)/home.module.css"

// هيرو typography-led — مفيش أي <img> خالص. الارتفاع = محتواه الفعلي بس،
// مفيش فرض svh ومفيش justify-content: space-between بيقدر يطلع فراغ ميت.
export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles["hero-bignum"]} aria-hidden="true">2Z</div>

      <div className={styles["hero-topbar"]}>
        <div className={styles["hero-eyebrow"]}>
          <div className={styles["hero-eyebrow-line"]} />
          <span className={styles["hero-eyebrow-text"]}>Egypt · SS26</span>
        </div>
        <span className={styles["hero-mark"]}>2Z</span>
      </div>

      <h1 className={styles["hero-title"]}>
        <span className={styles["hero-title-line"]}><span>Next</span></span>
        <span className={styles["hero-title-line"]}>
          <span>
            Level<span className={styles["hero-title-accent"]}>.</span>
          </span>
        </span>
      </h1>

      <div className={styles["hero-sub"]}>
        <div>
          <div className={styles["hero-divider"]} />
          <p className={styles["hero-desc"]}>
            Oversized T-Shirts<br />
            Black · White · Grey · Beige
          </p>
        </div>

        <Link href="/products" className={styles["btn-solid"]}>
          Shop Now
          <svg className={styles["btn-solid-arrow"]} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div className={styles["hero-bottom"]}>
        <p className={styles["hero-bottom-text"]}>Oversized Fit — Cut For The Streets</p>
        <div className={styles["scroll-hint"]} aria-hidden="true">
          <div className={styles["scroll-hint-track"]}>
            <div className={styles["scroll-hint-line"]} />
          </div>
        </div>
      </div>
    </section>
  )
}
