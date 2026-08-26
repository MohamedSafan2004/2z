import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function StatementSection() {
  return (
    <section className={styles["statement-section"]}>
      <RevealSection>
        <div className={styles["statement-row"]}>
          <div className={styles["statement-line"]} />
          <div>
            <p className={styles["statement-label"]}>The 2Z Philosophy</p>
            <h2 className={styles["statement-heading"]}>
              Less noise. <em style={{ color: "rgba(240,237,230,0.38)" }}>More presence.</em>
            </h2>
          </div>
          <div className={styles["statement-line"]} />
        </div>
      </RevealSection>
    </section>
  )
}
