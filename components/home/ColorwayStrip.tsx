// ⚠️ FILE UNUSED — مش متركب في app/(store)/page.tsx خالص.
// كان أول نسخة من شريط الألوان (color-block) قبل ما نستبدله بـ TrustStrip.tsx
// بطلب محمد، لأن الـ color-block كان UI حشو مالوش معنى تسويقي حقيقي.
// مفيش أداة delete متاحة على الـ Filesystem MCP، فالملف ده باقي على الجهاز
// بس مش هيدخل في الـ build خالص لأن مفيش أي import ليه في أي مكان.
// لو حبيت تمسحه فعليًا: امسحه يدويًا من VS Code أو File Explorer.

import styles from "../../app/(store)/home.module.css"

export function ColorwayStrip() {
  return (
    <div className={styles.colorstrip} aria-hidden="true">
      <div className={`${styles["colorstrip-cell"]} ${styles["c-black"]}`}>
        <span className={styles["colorstrip-label"]}>Black</span>
      </div>
      <div className={`${styles["colorstrip-cell"]} ${styles["c-white"]}`}>
        <span className={styles["colorstrip-label"]}>White</span>
      </div>
      <div className={`${styles["colorstrip-cell"]} ${styles["c-grey"]}`}>
        <span className={styles["colorstrip-label"]}>Grey</span>
      </div>
      <div className={`${styles["colorstrip-cell"]} ${styles["c-beige"]}`}>
        <span className={styles["colorstrip-label"]}>Beige</span>
      </div>
    </div>
  )
}
