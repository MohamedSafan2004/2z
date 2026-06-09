"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 20

export default function AdminPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setOrders(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    if (!hydrated) return
    if (!user) { router.push("/login"); return }
    if (user.role !== "ADMIN") { router.push("/"); return }
    fetchOrders()
  }, [user, hydrated])

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o))
  }

  if (loading) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)" }}>Loading...</p>
    </div>
  )

  const statusColor: Record<string, string> = {
    PENDING:   "rgba(240,200,100,0.9)",
    PAID:      "rgba(100,200,150,0.9)",
    SHIPPED:   "rgba(100,150,240,0.9)",
    DELIVERED: "rgba(100,220,100,0.9)",
    CANCELLED: "rgba(220,100,100,0.9)",
  }

  const statusBorder: Record<string, string> = {
    PENDING:   "rgba(240,200,100,0.25)",
    PAID:      "rgba(100,200,150,0.25)",
    SHIPPED:   "rgba(100,150,240,0.25)",
    DELIVERED: "rgba(100,220,100,0.25)",
    CANCELLED: "rgba(220,100,100,0.25)",
  }

  const paymentStatusColor: Record<string, string> = {
    PENDING: "rgba(240,200,100,0.7)",
    PAID:    "rgba(100,200,150,0.7)",
    FAILED:  "rgba(220,100,100,0.7)",
  }

  const revenue = orders
    .filter(o => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)

  const filtered = orders
    .filter(o => filterStatus === "ALL" || o.status === filterStatus)
    .filter(o => {
      if (search === "") return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.phone?.includes(q) ||
        o.phone?.includes(q) ||
        o.guestEmail?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        o.promoCode?.toLowerCase().includes(q)
      )
    })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const statuses = ["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 16px 60px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Dashboard</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6" }}>Admin</h1>
            
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            <button onClick={() => fetchOrders(true)} disabled={refreshing} style={{ padding: "9px 18px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: refreshing ? "not-allowed" : "pointer", background: "transparent", color: refreshing ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.6)", border: "1px solid rgba(240,237,230,0.15)" }}>
              {refreshing ? "..." : "↻ Refresh"}
            </button>
            <button
              onClick={async () => {
                const res = await fetch("/api/admin/export", { headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) return
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `2Z-Report-${new Date().toISOString().split("T")[0]}.xlsx`
                a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ padding: "9px 18px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: "pointer", background: "#f0ede6", color: "#080808", border: "1px solid #f0ede6" }}
            >
              Export Excel
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "32px" }}>
          {[
            { label: "Total Orders",    value: orders.length },
            { label: "Pending Payment", value: orders.filter(o => o.paymentStatus === "PENDING" && o.status !== "CANCELLED").length },
            { label: "To Ship",         value: orders.filter(o => o.status === "PAID").length },
            { label: "Revenue",         value: revenue.toLocaleString() + " EGP" },
          ].map((stat) => (
            <div key={stat.label} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "16px 20px" }}>
              <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <input type="text" placeholder="Search by name, phone, email, address, promo code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "10px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }} style={{ padding: "6px 14px", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", background: filterStatus === s ? "#f0ede6" : "transparent", color: filterStatus === s ? "#080808" : "rgba(240,237,230,0.4)", border: filterStatus === s ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)", cursor: "pointer", fontFamily: "Space Mono, monospace", transition: "all 0.2s" }}>
              {s === "ALL" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "16px" }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} — Page {page} of {totalPages || 1}
        </p>

        {paginated.length === 0 ? (
          <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.2)", letterSpacing: "0.2em" }}>No orders found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {paginated.map((order) => {
              const customerPhone = order.phone || order.user?.phone
              const customerName  = order.user?.name || "Guest"
              const customerEmail = order.guestEmail || order.user?.email

              return (
                <div key={order.id} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "12px", color: "#f0ede6", letterSpacing: "0.1em", marginBottom: "4px" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.1em" }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      {order.promoCode && (
                        <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", color: "rgba(80,200,120,0.9)", border: "1px solid rgba(80,200,120,0.25)" }}>
                          🏷 {order.promoCode} · -{Number(order.discountAmount).toLocaleString()} EGP
                        </span>
                      )}
                      <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", color: paymentStatusColor[order.paymentStatus] || "rgba(240,237,230,0.4)", border: `1px solid ${paymentStatusColor[order.paymentStatus] || "rgba(240,237,230,0.15)"}` }}>
                        Payment · {order.paymentStatus}
                      </span>
                      <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", color: statusColor[order.status], border: `1px solid ${statusBorder[order.status]}` }}>
                        Order · {order.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "14px", marginBottom: "14px" }}>
                    <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>Customer</p>
                    <p style={{ fontSize: "11px", color: "#f0ede6", marginBottom: "3px" }}>{customerName}</p>
                    {customerPhone && <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.6)", marginBottom: "2px" }}>{customerPhone}</p>}
                    {customerEmail && <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.35)", marginBottom: "2px" }}>{customerEmail}</p>}
                    {order.address && <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", marginTop: "6px", lineHeight: 1.7 }}>{order.address}</p>}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "14px", marginBottom: "14px" }}>
                    <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>Items</p>
                    {order.items.map((item: any) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.6)" }}>{item.productNameSnapshot} / {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}</p>
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)" }}>{(Number(item.priceSnapshot) * item.quantity).toLocaleString()} EGP</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      {order.promoCode && Number(order.discountAmount) > 0 && (
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.35)", marginBottom: "4px", letterSpacing: "0.05em" }}>
                          Original: {(Number(order.totalAmount) + Number(order.discountAmount)).toLocaleString()} EGP
                        </p>
                      )}
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", color: "#f0ede6" }}>
                        {Number(order.totalAmount).toLocaleString()}
                        <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace", marginLeft: "6px" }}>EGP</span>
                      </p>
                    </div>
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} style={{ background: "#111", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", padding: "8px 12px", fontSize: "8px", fontFamily: "Space Mono, monospace", cursor: "pointer", letterSpacing: "0.1em", outline: "none" }}>
                      {["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "8px 16px", fontSize: "9px", background: "transparent", color: page === 1 ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: "8px 14px", fontSize: "9px", background: page === p ? "#f0ede6" : "transparent", color: page === p ? "#080808" : "rgba(240,237,230,0.4)", border: page === p ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)", cursor: "pointer", fontFamily: "Space Mono, monospace" }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "8px 16px", fontSize: "9px", background: "transparent", color: page === totalPages ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}>→</button>
          </div>
        )}

      </div>
    </div>
  )
}