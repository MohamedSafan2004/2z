import Link from "next/link"
import { redirect } from "next/navigation"

const products = [
  { id: "1", name: "Essential Tee", price: 350, color: "Black", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=60" },
  { id: "2", name: "Essential Tee", price: 350, color: "White", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=60" },
  { id: "3", name: "Sweatpants", price: 650, color: "Black", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=60" },
  { id: "4", name: "Sweatpants", price: 650, color: "White", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=60" },
]

export default function Home() {
  redirect("/coming-soon")
  return (
    
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden" aria-label="Hero section">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=70"
          alt="2Z Minimal Streetwear Collection — Cairo Egypt"
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-45 grayscale-[30%] scale-100 hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, #080808 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(240,237,230,0.7)" }}>
            6th of October — 2026
          </p>
          <h1 className="font-serif font-light leading-none" style={{ fontSize: "clamp(56px, 12vw, 100px)", letterSpacing: "-0.02em", color: "#f0ede6" }}>
            Wear<br /><em style={{ color: "rgba(240,237,230,0.7)" }}>Nothing</em><br />Extra.
          </h1>
          <div className="flex justify-between items-end mt-6">
            <p className="text-xs tracking-widest uppercase leading-loose" style={{ color: "rgba(240,237,230,0.7)" }}>
              Oversized T-shirts.<br />Black & white.<br />That's it.
            </p>
            <Link href="/products" className="btn-outline text-xs tracking-[0.2em] uppercase px-5 py-3" aria-label="Shop 2Z collection">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* New In */}
      <section className="px-6 py-10" aria-label="New arrivals">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs tracking-[0.25em] uppercase" style={{ color: "#f0ede6" }}>New In</span>
          <span className="text-xs font-serif" style={{ color: "rgba(240,237,230,0.6)" }}>Check out </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link
              href={`/products/${p.id}`}
              key={p.id}
              className="group relative"
              aria-label={`View ${p.name} in ${p.color}`}
            >
              <div className="aspect-[3/4] relative overflow-hidden rounded-sm group" style={{ background: p.color === "Black" ? "#111" : "#2a2a2a" }}>
                <img
                  src={p.img}
                  alt={`${p.name} in ${p.color}`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[20%] group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #080808 0%, transparent 50%)" }} />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-serif font-light text-lg" style={{ color: "#f0ede6" }}>{p.name}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.7)" }}>{p.color}</span>
                    <span className="text-xs" style={{ color: "rgba(240,237,230,0.7)" }}>{p.price} EGP</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Statement */}
      <section className="px-6 py-16 text-center" aria-label="Brand philosophy">
        <p className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: "rgba(240,237,230,0.7)" }}>The 2Z Philosophy</p>
        <h2 className="font-serif font-light leading-tight" style={{ fontSize: "clamp(32px, 8vw, 60px)", color: "#f0ede6" }}>
          Less noise.<br /><em style={{ color: "rgba(240,237,230,0.7)" }}>More presence.</em>
        </h2>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-2 gap-[2px]" aria-label="Shop by category">
        {[
          { name: "T-Shirts", slug: "t-shirts", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=60" },
          { name: "Sweatpants", slug: "sweatpants", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=60" },
        ].map((cat) => (
          <Link
            href={`/products?category=${cat.slug}`}
            key={cat.slug}
            className="relative h-44 overflow-hidden group"
            aria-label={`Shop ${cat.name} collection`}
          >
            <img
              src={cat.img}
              alt={`2Z ${cat.name} collection`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale-[40%] group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(240,237,230,0.7)" }}>Collection</p>
              <p className="font-serif font-light text-2xl" style={{ color: "#f0ede6" }}>{cat.name}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Footer Strip */}
      <div className="flex justify-between items-center px-6 py-5" style={{ borderTop: "1px solid rgba(240,237,230,0.08)" }}>
        <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.6)" }}>2Z — 6th of October, Egypt</span>
        <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.6)" }}>Oversized T-shirts</span>
      </div>

    </div>
  )
}