import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function HomeFooterStrip() {
  return (
    <RevealSection>
      <div className={styles["footstrip-divider"]} />
      <div className={styles["footstrip-row"]}>
        <span className={styles["footstrip-text"]}>2Z — Egypt</span>
        <span className={styles["footstrip-text"]}>Oversized T-Shirts</span>
      </div>
    </RevealSection>
  )
}
