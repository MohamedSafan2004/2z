"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 20

export default function AdminPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  
  useEffect(() => {
    if (!user) { router.push("/login"); return }
    if (user.role !== "ADMIN") { router.push("/"); return }
    fetch("/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false) })
  }, [user])

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
    PENDING: "rgba(240,200,100,0.8)",
    PAID: "rgba(100,200,150,0.8)",
    SHIPPED: "rgba(100,150,240,0.8)",
    DELIVERED: "rgba(100,220,100,0.8)",
    CANCELLED: "rgba(220,100,100,0.8)",
  }

  const statusBorder: Record<string, string> = {
    PENDING: "rgba(240,200,100,0.3)",
    PAID: "rgba(100,200,150,0.3)",
    SHIPPED: "rgba(100,150,240,0.3)",
    DELIVERED: "rgba(100,220,100,0.3)",
    CANCELLED: "rgba(220,100,100,0.3)",
  }

  const revenue = orders
    .filter(o => o.status === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)

  const filtered = orders
  .filter(o => filterStatus === "ALL" || o.status === filterStatus)
  .filter(o => search === "" || o.id.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase()) || o.user?.phone?.includes(search))

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const statuses = ["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Header + Export */}
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Dashboard</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6" }}>Admin</h1>
          </div>
          <button
            onClick={async () => {
              const res = await fetch("/api/admin/export", {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!res.ok) return
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `2Z-Report-${new Date().toISOString().split("T")[0]}.xlsx`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ padding: "10px 20px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", background: "#f0ede6", color: "#080808", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", marginTop: "8px" }}
          >
            Export Excel
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "32px" }}>
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Pending", value: orders.filter(o => o.status === "PENDING").length },
            { label: "Shipped", value: orders.filter(o => o.status === "SHIPPED").length },
            { label: "Revenue", value: revenue.toLocaleString() + " EGP" },
          ].map((stat) => (
            <div key={stat.label} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "16px" }}>
              <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
<input
  type="text"
  placeholder="Enter Code..."
  value={search}
  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
  style={{
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "1px solid rgba(240,237,230,0.15)",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    outline: "none",
    marginBottom: "16px",
  }}
/>
        
        {/* Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1) }}
              style={{
                padding: "6px 14px",
                fontSize: "8px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                background: filterStatus === s ? "#f0ede6" : "transparent",
                color: filterStatus === s ? "#080808" : "rgba(240,237,230,0.4)",
                border: filterStatus === s ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)",
                cursor: "pointer",
                fontFamily: "Space Mono, monospace",
                transition: "all 0.2s",
              }}
            >
              {s === "ALL" ? `الكل (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Orders */}
        <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} — Page {page} of {totalPages || 1}
        </p>

        {paginated.length === 0 ? (
          <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.2)", letterSpacing: "0.2em" }}>No orders</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {paginated.map((order) => (
              <div key={order.id} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "16px" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", color: "#f0ede6", letterSpacing: "0.1em" }}>{order.id.slice(0, 8).toUpperCase()}</p>
                  <span style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 8px", border: `1px solid ${statusBorder[order.status]}`, color: statusColor[order.status] }}>
                    {order.status}
                  </span>
                </div>

              <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "12px", marginBottom: "12px" }}>
                <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Customer</p>
                <p style={{ fontSize: "11px", color: "#f0ede6" }}>{order.user?.name || "Guest"}</p>
                <p style={{ fontSize: "9px", color: "#f0ede6", marginTop: "2px" }}>{order.phone || order.user?.phone}</p>
                <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)", marginTop: "2px" }}>{order.guestEmail || order.user?.email}</p>
                {order.address && (
                  <p style={{ fontSize: "9px", color: "rgb(255, 255, 255)", marginTop: "4px", lineHeight: 1.6 }}>{order.address}</p>)}
              </div>

                <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "12px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Items</p>
                  {order.items.map((item: any) => (
                    <p key={item.id} style={{ fontSize: "9px", color: "rgba(240,237,230,0.55)", marginBottom: "3px" }}>
                      {item.productNameSnapshot} / {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}
                    </p>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", color: "#f0ede6" }}>
                    {Number(order.totalAmount).toLocaleString()} <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace" }}>EGP</span>
                  </p>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    style={{ background: "#111", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", padding: "7px 10px", fontSize: "8px", fontFamily: "Space Mono, monospace", cursor: "pointer", letterSpacing: "0.1em", outline: "none" }}
                  >
                    {["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "8px 16px", fontSize: "9px", letterSpacing: "0.15em", background: "transparent", color: page === 1 ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ padding: "8px 14px", fontSize: "9px", background: page === p ? "#f0ede6" : "transparent", color: page === p ? "#080808" : "rgba(240,237,230,0.4)", border: page === p ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)", cursor: "pointer", fontFamily: "Space Mono, monospace" }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "8px 16px", fontSize: "9px", letterSpacing: "0.15em", background: "transparent", color: page === totalPages ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}
            >
              →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}  