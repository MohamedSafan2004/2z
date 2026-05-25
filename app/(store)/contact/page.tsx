import Link from "next/link"

export default function ContactPage() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Get in touch</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "52px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px", lineHeight: 1 }}>
          Contact<br /><em style={{ color: "rgba(240,237,230,0.4)" }}>Us.</em>
        </h1>
        <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.15em", marginBottom: "56px", lineHeight: 1.8 }}>
          We're here to help — reach out anytime.
        </p>

        {/* WhatsApp */}
        <a href="https://wa.me/201065178342" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{ background: "#0f0f0f", padding: "32px", marginBottom: "2px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "10px" }}>WhatsApp</p>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "#f0ede6", marginBottom: "8px" }}>+20 10 6517 8342</p>
                <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.1em", lineHeight: 1.8 }}>Available daily — 24/7</p>
              </div>
              <div style={{ fontSize: "40px", color: "rgba(240,237,230,0.2)" }}>↗</div>
            </div>
          </div>
        </a>

        {/* Email */}
        <a href="mailto:2z.eg2004@gmail.com" style={{ textDecoration: "none" }}>
          <div style={{ background: "#0f0f0f", padding: "32px", marginBottom: "2px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "10px" }}>Email</p>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "#f0ede6", marginBottom: "8px", wordBreak: "break-all"}}>2z.eg2004@gmail.com</p>
                <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.1em", lineHeight: 1.8 }}>We reply within 24 hours</p>
              </div>
              <div style={{ fontSize: "40px", color: "rgba(240,237,230,0.2)" }}>↗</div>
            </div>
          </div>
        </a>

        {/* Instagram */}
        <a href="https://www.instagram.com/2z_offical?igsh=MWh3dWZiYWN1ZzdrZA%3D%3D" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{ background: "#0f0f0f", padding: "32px", marginBottom: "2px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "10px" }}>Instagram</p>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "#f0ede6", marginBottom: "8px" }}>@2z_offical</p>
                <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.1em", lineHeight: 1.8 }}>DM us anytime for orders, questions, or collabs</p>
              </div>
              <div style={{ fontSize: "40px", color: "rgba(240,237,230,0.2)" }}>↗</div>
            </div>
          </div>
        </a>

        {/* Policy Strip */}
        <div style={{ background: "#0f0f0f", padding: "32px", marginTop: "2px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          {[
            { num: "14", title: "Days Returns", desc: "Unworn items in original condition accepted within 14 days" },
            { num: "24", title: "Hour Reply", desc: "We respond to all emails and DMs within 24 hours" },
            { num: "EG", title: "Egypt Only", desc: "Currently shipping within Egypt only via courier" },
          ].map((item) => (
            <div key={item.title}>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "rgba(240,237,230,0.15)", marginBottom: "8px" }}>{item.num}</p>
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", marginBottom: "8px" }}>{item.title}</p>
              <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 1.8 }}>{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}