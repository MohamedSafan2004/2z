import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function StatementSection() {
  return (
    <RevealSection className={styles.statement}>
      <div className={styles["statement-row"]}>
        <div className={styles["statement-line"]} />
        <div>
          <p className={styles["statement-label"]}>The 2Z Philosophy</p>
          <h2 className={styles["statement-heading"]}>
            Less noise. <em style={{ fontStyle: "italic", color: "rgba(240,237,230,0.4)" }}>More presence.</em>
          </h2>
        </div>
        <div className={styles["statement-line"]} />
      </div>
    </RevealSection>
  )
}
