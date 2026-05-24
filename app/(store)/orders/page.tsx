"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

export default function OrdersPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
  }, [user])

  if (loading) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)" }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Your</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px" }}>Orders</h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "24px" }}>No orders yet</p>
            <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px" }}>
              Shop Now
            </Link>
          </div>
        ) : (
          <div>
            {orders.map((order: any) => (
              <div key={order.id} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "24px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "4px" }}>Order</p>
                    <p style={{ fontSize: "11px", color: "#f0ede6" }}>{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px", color: order.status === "DELIVERED" ? "rgba(100,200,100,0.7)" : order.status === "CANCELLED" ? "rgba(200,100,100,0.7)" : "rgba(240,237,230,0.4)" }}>
                      {order.status}
                    </p>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "#f0ede6" }}>
                      {Number(order.totalAmount)} <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "16px" }}>
                  {order.items.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.6)" }}>
                        {item.productNameSnapshot} — {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}
                      </p>
                      <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)" }}>
                        {Number(item.priceSnapshot) * item.quantity} EGP
                      </p>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.2)", marginTop: "16px" }}>
                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}