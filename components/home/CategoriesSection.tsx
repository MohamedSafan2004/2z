import Link from "next/link"
import { RevealSection } from "@/components/RevealSection"
import { optimizeCloudinaryUrl } from "@/lib/home-data"
import styles from "../../app/(store)/home.module.css"

export function CategoriesSection() {
  return (
    <section className={styles["categories-section"]}>
      {[
        { name: "T-Shirts",   slug: "t-shirts",   img: optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/collection-tee.jpg", 500), available: true  },
        { name: "Sweatpants", slug: "sweatpants",  img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp", available: false },
      ].map((cat, i) => (
        <RevealSection key={cat.slug} delay={i * 150}>
          {cat.available ? (
            <Link href={`/products?category=${cat.slug}`} className={styles["cat-link"]} style={{ position: "relative", height: "180px", overflow: "hidden", display: "block" }}>
              <img src={cat.img} alt={cat.name} loading="lazy" className={styles["cat-img"]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)", marginBottom: "4px" }}>Collection</p>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "#f0ede6", margin: 0 }}>{cat.name}</p>
              </div>
            </Link>
          ) : (
            <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
              <img src={cat.img} alt={cat.name} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.1, filter: "grayscale(100%)" }} />
              <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "4px" }}>Coming Soon</p>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "rgba(240,237,230,0.4)", margin: 0 }}>{cat.name}</p>
              </div>
            </div>
          )}
        </RevealSection>
      ))}
    </section>
  )
}
