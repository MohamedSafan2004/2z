import styles from "../../app/(store)/home.module.css"

// شريط ترست ماركتينج حقيقي — بدل الـ color-block اللي كان حشو UI مالوش
// فايدة تسويقية. النمط ده (3-4 نقط ثقة بأيقونات صغيرة) موجود في كل متجر
// حقيقي جاد (Galvano وغيره) لأنه بيرد على أسئلة العميل قبل ما يسألها:
// هل الشحن هيتأخر؟ هل ينفع أدفع لما يوصل؟ هل ينفع أرجعه؟
export function TrustStrip() {
  const items = [
    {
      label: "Cash on Delivery",
      sub: "Pay when it arrives",
      icon: (
        <path d="M2 7h20v10H2z M2 7l10-4 10 4 M6 11h4" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
    {
      label: "Fast Delivery",
      sub: "2–4 days nationwide",
      icon: (
        <path d="M3 12h13l-2-5h4l3 5v5H3z M7 20a2 2 0 100-4 2 2 0 000 4z M17 20a2 2 0 100-4 2 2 0 000 4z" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
    {
      label: "Easy Exchange",
      sub: "Within 14 days",
      icon: (
        <path d="M4 4v6h6 M20 20v-6h-6 M20 8a8 8 0 00-14.9-3.5 M4 16a8 8 0 0014.9 3.5" strokeLinecap="round" strokeLinejoin="round" />
      ),
    },
  ]

  return (
    <div className={styles["trust-strip"]}>
      {items.map((item) => (
        <div className={styles["trust-item"]} key={item.label}>
          <svg className={styles["trust-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            {item.icon}
          </svg>
          <div>
            <p className={styles["trust-label"]}>{item.label}</p>
            <p className={styles["trust-sub"]}>{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
