import Link from "next/link"
import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function ReviewsCta() {
  return (
    <RevealSection className={styles["reviews-cta"]}>
      <Link href="/products" className={styles["btn-solid"]}>
        Shop Now
        <svg className={styles["btn-solid-arrow"]} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </RevealSection>
  )
}
