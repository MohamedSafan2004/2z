"use client"

import { useEffect, useState, type CSSProperties } from "react"
import type { Order } from "./OrderCard"

type VariantOption = {
  id: string
  label: string
  stock: number
  price: number
}

type ProductResponse = {
  name: string
  price: number | string
  variants: { id: string; color: string; size: string; stockQuantity: number }[]
}[]

type Row = {
  key: string
  id?: string // موجود بس لو الصنف أصلاً جوه الأوردر
  variantId: string
  name: string
  quantity: string
  unitPrice: string
  isGift: boolean
}

type Props = {
  order: Order
  token: string | null
  onClose: () => void
  onSaved: (updated: Order) => void
  onUnauthorized: () => void
}

const MONO = "Space Mono, monospace"

const inputStyle: CSSProperties = {
  background: "rgba(240,237,230,0.04)",
  border: "1px solid rgba(240,237,230,0.2)",
  borderRadius: "2px",
  color: "#f0ede6",
  fontFamily: MONO,
  fontSize: "13px",
  padding: "9px 10px",
  outline: "none",
  boxSizing: "border-box",
}

const labelStyle: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "rgba(240,237,230,0.45)",
  fontWeight: 600,
  marginBottom: "8px",
  display: "block",
}

// نص فاضي = NaN (مش 0) عشان حقل فاضي بالغلط ميتحسبش سعر/كمية صفر
function toNum(value: string): number {
  if (value.trim() === "") return NaN
  return Number(value)
}

export default function EditOrderModal({ order, token, onClose, onSaved, onUnauthorized }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    order.items.map((item) => ({
      key: item.id,
      id: item.id,
      variantId: item.variantId,
      name: `${item.productNameSnapshot} — ${item.colorSnapshot} / ${item.sizeSnapshot}`,
      quantity: String(item.quantity),
      unitPrice: String(Number(item.priceSnapshot)),
      isGift: Boolean(item.isGift),
    }))
  )
  const [shipping, setShipping] = useState(() => String(Number(order.shippingCost)))
  const [discount, setDiscount] = useState(() => String(Number(order.discountAmount ?? 0)))
  const [options, setOptions] = useState<VariantOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [pickVariant, setPickVariant] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          onUnauthorized()
          return
        }
        if (!res.ok) throw new Error("failed")
        const data: ProductResponse = await res.json()
        if (cancelled) return
        setOptions(
          data.flatMap((product) =>
            product.variants.map((variant) => ({
              id: variant.id,
              label: `${product.name} — ${variant.color} / ${variant.size}`,
              stock: variant.stockQuantity,
              price: Number(product.price),
            }))
          )
        )
      })
      .catch(() => {
        if (!cancelled) setOptionsError("مقدرتش أحمّل قايمة المنتجات — مش هتقدر تضيف صنف جديد")
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key))
  }

  const addRow = () => {
    const option = options.find((o) => o.id === pickVariant)
    if (!option) return
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${prev.length}`,
        variantId: option.id,
        name: option.label,
        quantity: "1",
        unitPrice: String(option.price),
        isGift: false,
      },
    ])
    setPickVariant("")
  }

  const subtotal = rows.reduce(
    (sum, row) => (row.isGift ? sum : sum + toNum(row.unitPrice) * toNum(row.quantity)),
    0
  )
  const discountNum = toNum(discount)
  const shippingNum = toNum(shipping)
  const total = subtotal - discountNum + shippingNum

  const rowsInvalid =
    rows.length === 0 ||
    rows.some((row) => {
      const qty = toNum(row.quantity)
      const price = row.isGift ? 0 : toNum(row.unitPrice)
      return !Number.isInteger(qty) || qty < 1 || qty > 99 || !(price >= 0)
    })
  const invalid = rowsInvalid || !(shippingNum >= 0) || !(discountNum >= 0) || discountNum > subtotal

  const save = async () => {
    if (invalid || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: rows.map((row) => ({
            id: row.id,
            variantId: row.variantId,
            quantity: Number(row.quantity),
            unitPrice: row.isGift ? 0 : Number(row.unitPrice),
          })),
          shippingCost: Number(shipping),
          discountAmount: Number(discount),
        }),
      })
      if (res.status === 401) {
        onUnauthorized()
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`)
        return
      }
      onSaved(data as Order)
    } catch {
      setError("Network error — check your connection")
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : "—")

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", overflowY: "auto", padding: "40px 12px", fontFamily: MONO }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto", background: "#0d0d0d", border: "1px solid rgba(240,237,230,0.15)", borderRadius: "2px", padding: "22px 20px", color: "#f0ede6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", letterSpacing: "0.05em", fontWeight: 600, margin: 0 }}>
            Edit Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.6)", fontSize: "18px", cursor: saving ? "not-allowed" : "pointer", fontFamily: MONO }}
          >
            ✕
          </button>
        </div>

        {order.bostaTrackingNumber && (
          <p style={{ fontSize: "11px", color: "rgba(240,190,140,0.95)", border: "1px solid rgba(240,190,140,0.3)", padding: "8px 10px", marginBottom: "18px", lineHeight: 1.6 }}>
            ⚠ الأوردر ده اتبعت لـ Bosta قبل كده — التعديل هنا مش هيتحدّث عندهم.
          </p>
        )}

        <span style={labelStyle}>Items</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          {rows.map((row) => (
            <div key={row.key} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", paddingBottom: "10px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <p style={{ fontSize: "12px", margin: 0, color: "rgba(240,237,230,0.85)" }}>
                  {row.name}
                  {row.isGift && (
                    <span style={{ marginLeft: "8px", fontSize: "9px", color: "rgba(110,220,150,1)", border: "1px solid rgba(80,200,120,0.4)", padding: "1px 6px", borderRadius: "2px" }}>
                      GIFT
                    </span>
                  )}
                </p>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={row.quantity}
                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                aria-label="Quantity"
                style={{ ...inputStyle, width: "64px" }}
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={row.isGift ? "0" : row.unitPrice}
                disabled={row.isGift}
                onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                aria-label="Unit price"
                style={{ ...inputStyle, width: "96px", opacity: row.isGift ? 0.5 : 1 }}
              />
              <button
                onClick={() => removeRow(row.key)}
                aria-label="Remove item"
                style={{ background: "transparent", border: "1px solid rgba(220,100,100,0.4)", color: "rgba(235,120,120,1)", padding: "8px 10px", fontSize: "12px", borderRadius: "2px", cursor: "pointer", fontFamily: MONO }}
              >
                ✕
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <p style={{ fontSize: "11px", color: "rgba(235,120,120,1)", margin: 0 }}>لازم يفضل صنف واحد على الأقل (لو عايز تلغي الأوردر غيّر الـ status لـ CANCELLED).</p>
          )}
        </div>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", margin: "0 0 18px" }}>
          الخانة الأولى = الكمية، التانية = سعر الوحدة (EGP). المخزون بيتعدّل أوتوماتيك.
        </p>

        <span style={labelStyle}>Add item</span>
        <div style={{ display: "flex", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
          <select
            value={pickVariant}
            onChange={(e) => setPickVariant(e.target.value)}
            style={{ ...inputStyle, flex: "1 1 220px", background: "#111", cursor: "pointer" }}
          >
            <option value="">اختار صنف...</option>
            {options.map((option) => (
              <option key={option.id} value={option.id} disabled={option.stock <= 0}>
                {option.label} · stock {option.stock}
              </option>
            ))}
          </select>
          <button
            onClick={addRow}
            disabled={!pickVariant}
            style={{ padding: "9px 14px", fontSize: "12px", fontFamily: MONO, cursor: pickVariant ? "pointer" : "not-allowed", background: "rgba(120,180,255,0.12)", color: pickVariant ? "rgba(140,195,255,1)" : "rgba(140,195,255,0.4)", border: "1px solid rgba(120,180,255,0.4)", borderRadius: "2px", fontWeight: 500 }}
          >
            + Add
          </button>
        </div>
        {optionsError && <p style={{ fontSize: "11px", color: "rgba(235,120,120,1)", margin: "0 0 6px" }}>{optionsError}</p>}

        <div style={{ display: "flex", gap: "12px", margin: "20px 0", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}>
            <span style={labelStyle}>Shipping (EGP)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <span style={labelStyle}>Discount (EGP)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(240,237,230,0.12)", paddingTop: "14px", marginBottom: "16px", fontSize: "12px", color: "rgba(240,237,230,0.7)", lineHeight: 1.9 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{fmt(subtotal)} EGP</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Discount</span><span>− {fmt(discountNum)} EGP</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping</span><span>{fmt(shippingNum)} EGP</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "#f0ede6", marginTop: "6px" }}>
            <span>New total</span><span>{fmt(total)} EGP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(240,237,230,0.4)" }}>
            <span>Current total</span><span>{Number(order.totalAmount).toLocaleString()} EGP</span>
          </div>
        </div>

        {discountNum > subtotal && (
          <p style={{ fontSize: "11px", color: "rgba(235,120,120,1)", margin: "0 0 12px" }}>الخصم أكبر من إجمالي الأصناف.</p>
        )}
        {error && <p style={{ fontSize: "11px", color: "rgba(235,120,120,1)", margin: "0 0 12px" }}>✗ {error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ padding: "10px 16px", fontSize: "12px", fontFamily: MONO, cursor: saving ? "not-allowed" : "pointer", background: "transparent", color: "rgba(240,237,230,0.7)", border: "1px solid rgba(240,237,230,0.2)", borderRadius: "2px" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={invalid || saving}
            style={{ padding: "10px 18px", fontSize: "12px", fontFamily: MONO, fontWeight: 600, cursor: invalid || saving ? "not-allowed" : "pointer", background: invalid || saving ? "rgba(240,237,230,0.3)" : "#f0ede6", color: "#080808", border: "1px solid #f0ede6", borderRadius: "2px" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
