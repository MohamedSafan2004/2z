import Link from "next/link"
import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function ReviewsCta() {
  return (
    <section className={styles["reviews-cta-section"]}>
      <RevealSection>
        <Link href="/products" className={styles["shop-btn"]}>Shop Now</Link>
      </RevealSection>
    </section>
  )
}
