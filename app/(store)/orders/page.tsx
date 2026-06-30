"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import { SkeletonLine } from "@/components/Skeleton"
import { getGuestOrderTokens } from "@/lib/store/orderTracking"

type OrderItem = {
  id: string
  productNameSnapshot: string
  colorSnapshot: string
  sizeSnapshot: string
  quantity: number
  priceSnapshot: number | string
}

type Order = {
  id: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number | string
  shippingZone: string | null
  shippingCost: number | string
  createdAt: string
  address: string | null
  items: OrderItem[]
  verifyToken?: string
}

const statusColor: Record<string, string> = {
  PENDING_PAYMENT: "rgba(240,150,100,0.7)",
  PENDING:   "rgba(240,200,100,0.7)",
  CONFIRMED: "rgba(150,180,240,0.7)",
  PAID:      "rgba(100,200,150,0.7)",
  SHIPPED:   "rgba(100,150,240,0.7)",
  DELIVERED: "rgba(100,220,100,0.7)",
  CANCELLED: "rgba(220,100,100,0.7)",
}

function OrderSkeleton() {
  return (
    <div style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "24px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ width: "40%" }}>
          <SkeletonLine width="60%" height="10px" />
          <SkeletonLine width="80%" height="14px" />
        </div>
        <div style={{ width: "30%" }}>
          <SkeletonLine width="100%" height="10px" />
          <SkeletonLine width="70%" height="20px" />
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "16px" }}>
        <SkeletonLine width="100%" height="12px" />
        <SkeletonLine width="80%" height="12px" />
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (!hydrated) return

    // مستخدم مسجل دخول — نجيب من الـ API العادي
    if (user) {
      fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          if (r.status === 401) {
            logout()
            router.push("/login?expired=1")
            return null
          }
          return r.json()
        })
        .then((data) => {
          if (data === null) return
          if (Array.isArray(data)) setOrders(data)
          else setError("Failed to load orders")
        })
        .catch(() => setError("Something went wrong"))
        .finally(() => setLoading(false))
      return
    }

    // Guest — نجيب الأوردرات المحفوظة عن طريق الـ tokens في localStorage
    const guestTokens = getGuestOrderTokens()
    if (guestTokens.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(
      guestTokens.map((t) =>
        fetch(`/api/orders/${t.orderId}?token=${t.verifyToken}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results
        .filter((o): o is Order => o !== null)
        .map((o, i) => ({ ...o, verifyToken: guestTokens[i].verifyToken }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setOrders(valid)
      setLoading(false)
    })
  }, [user, hydrated])

  if (loading) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px 60px" }}>
        <SkeletonLine width="80px" height="10px" />
        <SkeletonLine width="200px" height="40px" />
        <div style={{ marginTop: "48px" }}>
          {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .order-card { animation: fadeUp 0.5s ease both; }
      `}</style>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Your</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px" }}>Orders</h1>

        {error && (
          <p style={{ fontSize: "10px", color: "#ff6b6b", textAlign: "center", letterSpacing: "0.1em", marginBottom: "24px" }}>{error}</p>
        )}

        {!error && orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "24px" }}>No orders yet</p>
            <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px" }}>
              Shop Now
            </Link>
          </div>
        ) : (
          <div>
            {orders.map((order, i) => {
              const zoneLabel = order.shippingZone === "cairo" ? "Cairo" : order.shippingZone === "giza" ? "Giza" : null
              const needsPayment = order.status === "PENDING_PAYMENT" && order.paymentMethod === "INSTAPAY"

              return (
                <div key={order.id} className="order-card" style={{ border: needsPayment ? "1px solid rgba(240,150,100,0.3)" : "1px solid rgba(240,237,230,0.08)", padding: "24px", marginBottom: "16px", animationDelay: `${i * 80}ms` }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "4px" }}>Order</p>
                      <p style={{ fontSize: "11px", color: "#f0ede6", marginBottom: "8px" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.1em" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {zoneLabel && (
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.08em", marginTop: "4px" }}>
                          📍 {zoneLabel} · {Number(order.shippingCost)} EGP shipping
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase",
                        padding: "3px 8px", marginBottom: "6px", display: "inline-block",
                        color: statusColor[order.status] || "rgba(240,237,230,0.4)",
                        border: `1px solid ${statusColor[order.status] || "rgba(240,237,230,0.15)"}`,
                      }}>
                        {order.status === "PENDING_PAYMENT" ? "Awaiting Payment" : order.status}
                      </span>
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", color: "#f0ede6", marginTop: "6px" }}>
                        {Number(order.totalAmount).toLocaleString()} <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
                      </p>
                    </div>
                  </div>

                  {needsPayment && (
                    <Link
                      href={`/instapay-payment/${order.id}?token=${order.verifyToken}`}
                      style={{
                        display: "block", textAlign: "center", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase",
                        color: "#080808", background: "rgba(240,150,100,0.85)", padding: "12px", marginBottom: "16px",
                        textDecoration: "none", fontFamily: "Space Mono, monospace",
                      }}
                    >
                      Complete InstaPay Payment →
                    </Link>
                  )}

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "16px" }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.6)" }}>
                          {item.productNameSnapshot} — {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}
                        </p>
                        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)" }}>
                          {(Number(item.priceSnapshot) * item.quantity).toLocaleString()} EGP
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.address && (
                    <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", marginTop: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
                      📍 {order.address}
                    </p>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}