"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import OrderCard from "@/components/admin/OrderCard"

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

type Stats = {
  totalOrders: number
  revenue: number
  awaitingInstapay: number
  toShip: number
  byStatus: Record<string, number>
}

export default function AdminPage() {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<{ orderId: string; message: string } | null>(null)
  const [bostaSendingId, setBostaSendingId] = useState<string | null>(null)
  const [bostaError, setBostaError] = useState<{ orderId: string; message: string } | null>(null)
  const [bostaSuccessId, setBostaSuccessId] = useState<string | null>(null)

  useEffect(() => {
    queueMicrotask(() => setHydrated(true))
  }, [])

  // Debounce للبحث — من غير كده كل حرف بيبعت request جديد للسيرفر
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (filterStatus !== "ALL") params.set("status", filterStatus)
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setLoadError(data.error || `فشل تحميل الأوردرات (${res.status})`)
        return
      }

      const data = await res.json()
      setOrders(Array.isArray(data.orders) ? data.orders : [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch {
      setLoadError("مفيش اتصال بالسيرفر — اتأكد من الإنترنت وحاول تاني")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, filterStatus, debouncedSearch])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
      if (!res.ok) return
      const data = await res.json()
      setStats(data)
    } catch {
      // الأرقام مش حرجة زي جدول الأوردرات نفسه — لو فشلت بنسيبها من غير ما نوقف الصفحة
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!hydrated) return
    if (!user) { router.push("/login"); return }
    if (user.role !== "ADMIN") { router.push("/"); return }
    queueMicrotask(() => { fetchOrders(); fetchStats() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hydrated, page, filterStatus, debouncedSearch])

  // ترتيب التقدم الطبيعي للأوردر — مستخدم بس لتحديد لو التغيير "رجوع للخلف" (محتاج
  // تأكيد)، مش لفرض أي ترتيب حقيقي على التدفق
  const STATUS_ORDER = ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED"]

  const updateStatus = async (orderId: string, status: string) => {
    // تأكيد بس على التغييرات الخطرة: الإلغاء (CANCELLED) أو الرجوع لخطوة سابقة —
    // أي تقدم طبيعي للأمام (مثلاً PENDING → CONFIRMED) بيتنفذ فوري زي ما كان
    const current = orders.find((o) => o.id === orderId)
    if (current && current.status !== status) {
      const isCancel = status === "CANCELLED"
      const currentIdx = STATUS_ORDER.indexOf(current.status)
      const nextIdx = STATUS_ORDER.indexOf(status)
      const isBackward = currentIdx !== -1 && nextIdx !== -1 && nextIdx < currentIdx

      if (isCancel || isBackward) {
        const confirmed = window.confirm(
          `متأكد إنك عايز تغير الأوردر #${orderId.slice(0, 8).toUpperCase()} من ${current.status} لـ ${status}؟`
        )
        if (!confirmed) return
      }
    }

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    if (res.status === 401) { logout(); router.push("/login?expired=1"); return }
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o))
    fetchStats()
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
      fetchStats()
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
        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(240,237,230,0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgb(200 168 40)", marginBottom: "8px", fontWeight: 600 }}>Admin Dashboard</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 400, lineHeight: 1, margin: 0, color: "#f0ede6" }}>
              Welcome, <span style={{ color: "rgba(200,235,210,0.9)" }}>Mr.7dido</span>
            </h1>
          </div>

          {/* الأزرار اتنقلت هنا جنب الـ header مباشرة بدل صف منفصل متساوي في الأهمية —
              Export (أكتر استخدامًا) بارز، وRefresh/Sync (أدوات ثانوية) متجمعين بشكل أصغر وأهدأ */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => fetchOrders(true)} disabled={refreshing} style={{ padding: "8px 14px", fontSize: "10px", letterSpacing: "0.08em", fontFamily: "Space Mono, monospace", cursor: refreshing ? "not-allowed" : "pointer", background: "transparent", color: refreshing ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.65)", border: "1px solid rgba(240,237,230,0.18)", borderRadius: "2px" }}>
                {refreshing ? "..." : "↻ Refresh"}
              </button>
              <button
                onClick={syncInventory}
                disabled={syncing}
                style={{ padding: "8px 14px", fontSize: "10px", letterSpacing: "0.08em", fontFamily: "Space Mono, monospace", cursor: syncing ? "not-allowed" : "pointer", background: "transparent", color: syncing ? "rgba(100,200,150,0.35)" : "rgba(110,215,160,1)", border: "1px solid rgba(100,200,150,0.35)", borderRadius: "2px" }}
              >
                {syncing ? "..." : "⇅ Sync Inventory"}
              </button>
              {syncMsg && (
                <span style={{ fontSize: "10px", letterSpacing: "0.05em", color: syncMsg.startsWith("✓") ? "rgba(120,220,170,1)" : "rgba(235,120,120,1)" }}>
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
              style={{ padding: "9px 18px", fontSize: "10px", letterSpacing: "0.08em", fontFamily: "Space Mono, monospace", cursor: "pointer", background: "#f0ede6", color: "#080808", border: "1px solid #f0ede6", borderRadius: "2px", fontWeight: 600 }}
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Stats — 4 أعمدة على desktop (صف واحد مستغل للمساحة الأفقية)، 2 عمود على الموبايل —
            كل كارت لون دال على طبيعته (أخضر=Revenue إيجابي، برتقالي=Awaiting محتاج أكشن) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1px", marginBottom: "28px", border: "1px solid rgba(240,237,230,0.1)", background: "rgba(240,237,230,0.1)" }}>
          {[
            { label: "Total Orders",      value: stats ? stats.totalOrders : "—", accent: "#f0ede6" },
            { label: "Awaiting InstaPay", value: stats ? stats.awaitingInstapay : "—", accent: "rgba(240,180,110,1)" },
            { label: "To Ship",           value: stats ? stats.toShip : "—", accent: "rgba(140,195,255,1)" },
            { label: "Revenue",           value: stats ? stats.revenue.toLocaleString() + " EGP" : "—", accent: "rgba(120,220,170,1)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#080808", padding: "18px 20px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", marginBottom: "10px", fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", color: stat.accent, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search — أيقونة داخلة للحقل وpadding أكبر — يبان فعليًا إنه حقل بحث مش مجرد input عادي */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "rgba(240,237,230,0.35)", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, email, address, promo code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 14px 12px 38px", background: "rgba(240,237,230,0.03)", border: "1px solid rgba(240,237,230,0.18)", borderRadius: "2px", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }} style={{ padding: "7px 14px", fontSize: "10px", letterSpacing: "0.04em", borderRadius: "2px", fontWeight: filterStatus === s ? 600 : 400, background: filterStatus === s ? "#f0ede6" : "transparent", color: filterStatus === s ? "#080808" : "rgba(240,237,230,0.65)", border: filterStatus === s ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.2)", cursor: "pointer", fontFamily: "Space Mono, monospace", transition: "all 0.15s" }}>
              {s === "ALL" ? `All (${stats ? stats.totalOrders : "—"})` : `${s} (${stats ? (stats.byStatus[s] || 0) : "—"})`}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "11px", letterSpacing: "0.05em", color: "rgba(240,237,230,0.5)", marginBottom: "16px" }}>
          {totalCount} order{totalCount !== 1 ? "s" : ""} — Page {page} of {totalPages || 1}
        </p>

        {loadError && (
          <div style={{ border: "1px solid rgba(220,100,100,0.3)", background: "rgba(220,100,100,0.06)", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "10px", color: "rgba(220,100,100,0.9)", letterSpacing: "0.05em" }}>✗ {loadError}</span>
            <button onClick={() => fetchOrders()} style={{ padding: "7px 14px", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", cursor: "pointer", background: "transparent", color: "rgba(220,100,100,0.9)", border: "1px solid rgba(220,100,100,0.3)" }}>
              Retry
            </button>
          </div>
        )}

        {!loadError && orders.length === 0 ? (
          <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.2)", letterSpacing: "0.2em" }}>No orders found</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {orders.map((order) => {
              // لو نفس الرقم/الإيميل ظاهر في أوردر تاني في نفس الصفحة الحالية، نوري badge —
              // مجرد إشارة، مش بحث فعلي لكل تاريخ العميل (الأوردرات في صفحات تانية مش محسوبة)
              const orderKey = order.phone || order.user?.phone || order.guestEmail || order.user?.email
              const isRepeatCustomer = orderKey
                ? orders.some((o) => o.id !== order.id && (o.phone || o.user?.phone || o.guestEmail || o.user?.email) === orderKey)
                : false

              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  formatDate={formatDate}
                  statusColor={statusColor}
                  statusBorder={statusBorder}
                  paymentStatusColor={paymentStatusColor}
                  onPrint={printPackingSlip}
                  onUpdateStatus={updateStatus}
                  onConfirmInstapay={confirmInstapay}
                  confirmingId={confirmingId}
                  confirmError={confirmError}
                  onSendToBosta={sendToBosta}
                  bostaSendingId={bostaSendingId}
                  bostaError={bostaError}
                  bostaSuccessId={bostaSuccessId}
                  isRepeatCustomer={isRepeatCustomer}
                />
              )
            })}
          </div>
        )}

        {totalPages > 1 && (() => {
          // لو عدد الصفحات كبير، منوريشش زرار لكل صفحة — نوري 7 أرقام حوالين الصفحة الحالية بس
          const windowSize = 3
          const start = Math.max(1, page - windowSize)
          const end = Math.min(totalPages, page + windowSize)
          const pagesToShow = Array.from({ length: end - start + 1 }, (_, i) => start + i)

          return (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "8px 16px", fontSize: "9px", background: "transparent", color: page === 1 ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}>←</button>
              {start > 1 && <span style={{ color: "rgba(240,237,230,0.3)", fontSize: "9px" }}>…</span>}
              {pagesToShow.map((p) => (
                <button key={p} onClick={() => setPage(p)} style={{ padding: "8px 14px", fontSize: "9px", background: page === p ? "#f0ede6" : "transparent", color: page === p ? "#080808" : "rgba(240,237,230,0.4)", border: page === p ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)", cursor: "pointer", fontFamily: "Space Mono, monospace" }}>{p}</button>
              ))}
              {end < totalPages && <span style={{ color: "rgba(240,237,230,0.3)", fontSize: "9px" }}>…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "8px 16px", fontSize: "9px", background: "transparent", color: page === totalPages ? "rgba(240,237,230,0.2)" : "#f0ede6", border: "1px solid rgba(240,237,230,0.15)", cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace" }}>→</button>
            </div>
          )
        })()}

      </div>
    </div>
  )
}