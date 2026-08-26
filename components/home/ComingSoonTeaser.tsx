import { RevealSection } from "@/components/RevealSection"
import styles from "../../app/(store)/home.module.css"

export function ComingSoonTeaser() {
  return (
    <section className={styles["comingsoon-section"]}>
      <RevealSection delay={100}>
        <div className={styles["comingsoon-box"]}>
          <div style={{ flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div className={styles["comingsoon-dot"]} style={{ width: "5px", height: "5px" }} />
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Next Drop</span>
            </div>
            <h2 className={styles["shimmer-text"]}>Sweatpants.</h2>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(240,237,230,0.12)", padding: "9px 16px", width: "fit-content" }}>
            <div className={styles["comingsoon-dot"]} style={{ width: "4px", height: "4px" }} />
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.65)" }}>Coming Soon</span>
            </div>
          </div>
          <div style={{ width: "clamp(80px, 26%, 160px)", position: "relative", overflow: "hidden", borderLeft: "1px solid rgba(240,237,230,0.08)", flexShrink: 0 }}>
            <img
              src="https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=50&fm=webp"
              alt="Sweatpants coming soon"
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, filter: "grayscale(100%)" }}
            />
          </div>
        </div>
      </RevealSection>
    </section>
  )
}
