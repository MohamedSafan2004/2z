"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 20

type OrderItem = {
  id: string
  productNameSnapshot: string
  colorSnapshot: string
  sizeSnapshot: string
  quantity: number
  priceSnapshot: number | string
}

type OrderUser = {
  name?: string
  phone?: string
  email?: string
}

type Order = {
  id: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number | string
  discountAmount?: number | string
  promoCode?: string | null
  shippingZone: string | null
  shippingCost: number | string
  createdAt: string
  address: string | null
  phone?: string | null
  guestEmail?: string | null
  invoiceNumber?: number | null
  instapayRef?: string | null
  bostaTrackingNumber?: string | null
  bostaState?: string | null
  items: OrderItem[]
  user?: OrderUser
}

function printPackingSlip(order: Order) {
  const invoiceNum = order.invoiceNumber
    ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
    : `#${order.id.slice(0, 8).toUpperCase()}`

  const itemsHtml = order.items.map((item: OrderItem) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px">${item.productNameSnapshot} — ${item.colorSnapshot} / ${item.sizeSnapshot}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:center">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right">${(Number(item.priceSnapshot) * item.quantity).toLocaleString()} EGP</td>
    </tr>
  `).join("")

  const promoHtml = order.promoCode && Number(order.discountAmount) > 0 ? `
    <tr>
      <td colspan="2" style="padding:6px 0;font-size:12px;color:#888">Promo: ${order.promoCode}</td>
      <td style="padding:6px 0;font-size:12px;color:#888;text-align:right">− ${Number(order.discountAmount).toLocaleString()} EGP</td>
    </tr>
  ` : ""

  const win = window.open("", "_blank")
  if (!win) return

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Packing Slip — ${invoiceNum}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; color: #111; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #111; }
        .brand { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
        .brand-sub { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-top: 4px; }
        .invoice-num { font-size: 13px; font-weight: 600; text-align: right; }
        .invoice-date { font-size: 11px; color: #888; text-align: right; margin-top: 4px; }
        .section { margin-bottom: 24px; }
        .section-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 8px; }
        .section-value { font-size: 14px; line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; padding: 0 0 10px; border-bottom: 1px solid #111; }
        th:last-child, td:last-child { text-align: right; }
        th:nth-child(2), td:nth-child(2) { text-align: center; }
        .total-row td { padding: 12px 0 0; font-size: 16px; font-weight: 700; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">2Z</div>
          <div class="brand-sub">Minimal Streetwear</div>
        </div>
        <div>
          <div class="invoice-num">${invoiceNum}</div>
          <div class="invoice-date">${new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Deliver To</div>
        <div class="section-value">
          <strong>${order.user?.name || "Guest"}</strong><br/>
          ${order.phone || order.user?.phone || ""}<br/>
          ${order.address || ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left">Item</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${promoHtml}
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td>${Number(order.totalAmount).toLocaleString()} EGP</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        2Z Store · Cairo, Egypt · 2zstore.com
      </div>

      <script>window.onload = () => { window.print() }</script>
    </body>
    </html>
  `)
  win.document.close()
}

export default function AdminPage() {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<{ orderId: string; message: string } | null>(null)
  const [bostaSendingId, setBostaSendingId] = useState<string | null>(null)
  const [bostaError, setBostaError] = useState<{ orderId: string; message: string } | null>(null)
  const [bostaSuccessId, setBostaSuccessId] = useState<string | null>(null)

  useEffect(() => {
    queueMicrotask(() => setHydrated(true))
  }, [])

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!hydrated) return
    if (!user) { router.push("/login"); return }
    if (user.role !== "ADMIN") { router.push("/"); return }
    queueMicrotask(() => { fetchOrders() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hydrated])

  const updateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o))
  }

  const confirmInstapay = async (orderId: string) => {
    setConfirmingId(orderId)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "confirm_instapay" }),
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setConfirmError({ orderId, message: data.error || `Failed (${res.status})` })
        return
      }

      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: "PAID", status: "PAID" } : o
      ))
    } catch {
      setConfirmError({ orderId, message: "Network error — check your connection" })
    } finally {
      setConfirmingId(null)
    }
  }

  const sendToBosta = async (orderId: string) => {
    const confirmed = window.confirm("هتبعت الأوردر ده لـ Bosta دلوقتي — Bosta هتأكد مع العميل وتشحن. متأكد؟")
    if (!confirmed) return

    setBostaSendingId(orderId)
    setBostaError(null)
    setBostaSuccessId(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "send_to_bosta" }),
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setBostaError({ orderId, message: data.error || `Failed (${res.status})` })
        return
      }

      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, bostaTrackingNumber: data.bostaTrackingNumber, bostaState: data.bostaState } : o
      ))
      setBostaSuccessId(orderId)
      setTimeout(() => setBostaSuccessId((cur) => (cur === orderId ? null : cur)), 4000)
    } catch {
      setBostaError({ orderId, message: "Network error — check your connection" })
    } finally {
      setBostaSendingId(null)
    }
  }

  const syncInventory = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch("/api/admin/sync-inventory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
      if (res.ok) {
        setSyncMsg("✓ Synced")
      } else {
        setSyncMsg("✗ Failed")
      }
    } catch {
      setSyncMsg("✗ Failed")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 3000)
    }
  }

  if (loading) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)" }}>Loading...</p>
    </div>
  )

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "rgba(240,150,100,0.9)",
    PENDING:   "rgba(240,200,100,0.9)",
    CONFIRMED: "rgba(120,180,255,0.9)",
    PAID:      "rgba(100,200,150,0.9)",
    SHIPPED:   "rgba(100,150,240,0.9)",
    DELIVERED: "rgba(100,220,100,0.9)",
    CANCELLED: "rgba(220,100,100,0.9)",
  }

  const statusBorder: Record<string, string> = {
    PENDING_PAYMENT: "rgba(240,150,100,0.25)",
    PENDING:   "rgba(240,200,100,0.25)",
    CONFIRMED: "rgba(120,180,255,0.25)",
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
    .filter(o => o.status === "PAID" || o.status === "DELIVERED")
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
  const statuses = ["ALL", "PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "48px", paddingBottom: "40px", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgb(179 149 26)", marginBottom: "12px" }}>Admin Dashboard</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(42px, 7vw, 72px)", fontWeight: 300, lineHeight: 1, margin: 0, color: "#f0ede6" }}>
            Welcome <em style={{ fontStyle: "italic", color: "rgba(9, 159, 56, 0.35)" }}>Mr.7dido</em>
          </h1>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <button onClick={() => fetchOrders(true)} disabled={refreshing} style={{ padding: "9px 18px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: refreshing ? "not-allowed" : "pointer", background: "transparent", color: refreshing ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.6)", border: "1px solid rgba(240,237,230,0.15)" }}>
            {refreshing ? "..." : "↻ Refresh"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={syncInventory}
              disabled={syncing}
              style={{ padding: "9px 18px", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: syncing ? "not-allowed" : "pointer", background: "transparent", color: syncing ? "rgba(240,237,230,0.3)" : "rgba(100,200,150,0.8)", border: "1px solid rgba(100,200,150,0.25)" }}
            >
              {syncing ? "..." : "⇅ Sync Inventory"}
            </button>
            {syncMsg && (
              <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: syncMsg.startsWith("✓") ? "rgba(100,200,150,0.8)" : "rgba(220,100,100,0.8)" }}>
                {syncMsg}
              </span>
            )}
          </div>
          <button
            onClick={async () => {
              const res = await fetch("/api/admin/export", { headers: { Authorization: `Bearer ${token}` } })
              if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
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

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "32px" }}>
          {[
            { label: "Total Orders",      value: orders.length },
            { label: "Awaiting InstaPay", value: orders.filter(o => o.paymentMethod === "INSTAPAY" && o.paymentStatus !== "PAID" && o.status !== "CANCELLED").length },
            { label: "To Ship",           value: orders.filter(o => o.status === "PAID" || o.status === "CONFIRMED").length },
            { label: "Revenue",           value: revenue.toLocaleString() + " EGP" },
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
              const invoiceNum = order.invoiceNumber
                ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
                : null

              return (
                <div key={order.id} style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <p style={{ fontSize: "12px", color: "#f0ede6", letterSpacing: "0.1em", margin: 0 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                        {invoiceNum && (
                          <span style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", border: "1px solid rgba(240,237,230,0.12)", padding: "2px 7px" }}>
                            {invoiceNum}
                          </span>
                        )}
                      </div>
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
                    {order.shippingZone && (
                      <p style={{ fontSize: "9px", color: "rgba(240,200,150,0.7)", marginTop: "4px", letterSpacing: "0.05em" }}>
                        📍 {Number(order.shippingCost).toLocaleString()} EGP shipping
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "14px", marginBottom: "14px" }}>
                    <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>Items</p>
                    {order.items.map((item: OrderItem) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.6)" }}>{item.productNameSnapshot} / {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}</p>
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)" }}>{(Number(item.priceSnapshot) * item.quantity).toLocaleString()} EGP</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      {order.promoCode && Number(order.discountAmount) > 0 && (
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.35)", marginBottom: "4px" }}>
                          Original: {(Number(order.totalAmount) + Number(order.discountAmount)).toLocaleString()} EGP
                        </p>
                      )}
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", color: "#f0ede6" }}>
                        {Number(order.totalAmount).toLocaleString()}
                        <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace", marginLeft: "6px" }}>EGP</span>
                      </p>
                    </div>
                   <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => printPackingSlip(order)}
                      style={{ padding: "8px 14px", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: "pointer", background: "transparent", color: "rgba(240,237,230,0.5)", border: "1px solid rgba(240,237,230,0.15)" }}
                    >
                      🖨 Print
                    </button>

                    {order.paymentMethod === "INSTAPAY" && order.paymentStatus !== "PAID" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                        <button
                          onClick={() => confirmInstapay(order.id)}
                          disabled={confirmingId === order.id}
                          style={{ padding: "8px 14px", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: confirmingId === order.id ? "not-allowed" : "pointer", background: "rgba(100,200,150,0.1)", color: confirmingId === order.id ? "rgba(100,200,150,0.4)" : "rgba(100,200,150,0.9)", border: "1px solid rgba(100,200,150,0.3)" }}
                        >
                          {confirmingId === order.id ? "..." : "✓ Confirm InstaPay"}
                        </button>
                        {confirmError?.orderId === order.id && (
                          <span style={{ fontSize: "8px", color: "rgba(220,100,100,0.9)", letterSpacing: "0.05em", maxWidth: "200px" }}>
                            {confirmError.message}
                          </span>
                        )}
                      </div>
                    )}

                    {order.paymentMethod === "INSTAPAY" && order.instapayRef && (
                      <span style={{ fontSize: "8px", color: "rgba(240,237,230,0.35)", letterSpacing: "0.08em", fontFamily: "Space Mono, monospace" }}>
                        Ref: {order.instapayRef}
                      </span>
                    )}

                    {!order.bostaTrackingNumber && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                        <button
                          onClick={() => sendToBosta(order.id)}
                          disabled={bostaSendingId === order.id}
                          style={{ padding: "8px 14px", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: bostaSendingId === order.id ? "not-allowed" : "pointer", background: "rgba(120,180,255,0.1)", color: bostaSendingId === order.id ? "rgba(120,180,255,0.4)" : "rgba(120,180,255,0.9)", border: "1px solid rgba(120,180,255,0.3)" }}
                        >
                          {bostaSendingId === order.id ? "Sending..." : "📦 Send to Bosta"}
                        </button>
                        {bostaError?.orderId === order.id && (
                          <span style={{ fontSize: "8px", color: "rgba(220,100,100,0.9)", letterSpacing: "0.05em", maxWidth: "220px" }}>
                            ✗ {bostaError.message}
                          </span>
                        )}
                        {bostaSuccessId === order.id && (
                          <span style={{ fontSize: "8px", color: "rgba(100,200,150,0.9)", letterSpacing: "0.05em" }}>
                            ✓ اتبعتت لـ Bosta بنجاح
                          </span>
                        )}
                      </div>
                    )}

                    {order.bostaTrackingNumber && (
                      <span style={{ fontSize: "8px", color: "rgba(120,180,255,0.85)", letterSpacing: "0.08em", fontFamily: "Space Mono, monospace", border: "1px solid rgba(120,180,255,0.25)", padding: "3px 8px" }}>
                        📦 {order.bostaTrackingNumber}{order.bostaState ? ` · ${order.bostaState}` : ""}
                      </span>
                    )}

                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} style={{ background: "#111", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", padding: "8px 12px", fontSize: "8px", fontFamily: "Space Mono, monospace", cursor: "pointer", letterSpacing: "0.1em", outline: "none" }}>
                      {["PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
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