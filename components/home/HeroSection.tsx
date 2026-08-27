import Link from "next/link"
import styles from "../../app/(store)/home.module.css"

// هيرو بصورة حقيقية (تيشيرت أسود) — الجملة الكاملة "2Z Next Level."
// سطر واحد متكامل، مش "2Z" منفصلة كـ eyebrow صغير برة العنوان.
export function HeroSection() {
  return (
    <section className={styles.hero}>
      <img
        className={styles["hero-img"]}
        src="https://res.cloudinary.com/ghetnovd/image/upload/f_auto,q_auto,w_1200/2z-store/tee-black.jpg"
        alt="2Z Oversize Tee — Black"
      />

      <div className={styles["hero-content"]}>
        <div className={styles["hero-topbar"]}>
          <div className={styles["hero-eyebrow"]}>
            <div className={styles["hero-eyebrow-line"]} />
            <span className={styles["hero-eyebrow-text"]}>Egypt · SS26</span>
          </div>
        </div>

        <div className={styles["hero-bottom-stack"]}>
          <h1 className={styles["hero-title"]}>
            <span className={styles["hero-title-line"]}><span>2Z Next</span></span>
            <span className={styles["hero-title-line"]}><span>Level.</span></span>
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
        </div>
      </div>
    </section>
  )
}
