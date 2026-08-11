"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useCart } from "@/lib/store/cart"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SHIPPING_RATES, SHIPPING_LABELS, getFinalShippingCost, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"
import { BOSTA_CITIES } from "@/lib/cities"
import { saveGuestOrderToken } from "@/lib/store/orderTracking"
import { trackInitiateCheckout, trackPurchase, tagClarityOrder, generateEventId } from "@/lib/meta-pixel"

import CheckoutCard from "./components/Checkoutcard "
import InputField from "./components/Inputfield"
import PaymentCard from "./components/Paymentcard"
import PromoCard from "./components/Promocard"
import OrderSummaryBody from "./components/Ordersummarybody"
import OrderSummarySheet from "./components/Ordersummarysheet"
import StickyCheckoutBar from "./components/Stickycheckoutbar"

type PaymentMethod = "cod" | "instapay"

const paymentMethods = [
  { id: "cod" as PaymentMethod,      label: "Cash on delivery", sub: "Pay when you receive" },
  // InstaPay مخفي مؤقتًا من الـ UI بطلب محمد — الفلو التقني لسه موجود بالكامل
  // (payment logic, /api/orders, /instapay-payment/[orderId]) عشان أوردر قديم معمولة بية متكسرش.
  // لإرجاع InstaPay للعملاء الجدد: شيل الكومنت اللي تحت دي وبس.
  // { id: "instapay" as PaymentMethod, label: "InstaPay",          sub: "Transfer and confirm instantly" },
]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CheckoutPage() {
  const { items, gifts, total, clearCart } = useCart()
  const { user, token } = useAuth()
  const router = useRouter()

  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [phone, setPhone]         = useState("")
  const [address, setAddress]     = useState("")
  const [city, setCity]           = useState("")
  // منطقة التوصيل ثابتة دلوقتي (شحن موحّد لمصر كله) — مفيش اختيار للعميل
  const zone = "egypt" as const
  const [payment, setPayment]     = useState<PaymentMethod>("cod")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)

  // clientOrderId ثابت لكل محاولة checkout واحدة — لو الطلب اتبعت مرتين (ضعف شبكة، ضغط زرار
  // مرتين) السيرفر هيعرف يرجّع نفس الأوردر بدل ما يعمل واحد جديد ويخصم ستوك مرتين
  const [clientOrderId] = useState(() => crypto.randomUUID())

  const [promoInput, setPromoInput]       = useState("")
  const [promoApplied, setPromoApplied]   = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading]   = useState(false)
  const [promoError, setPromoError]       = useState("")
  const [promoSuccess, setPromoSuccess]   = useState("")
  // قفل فوري متزامن (mush معتمد على re-render) ضد ضغط المستخدم المتكرر
  // على زرار Apply قبل ما الطلب الأول يخلص — promoLoading (state) ممكن تفضل نافذة
  // صغيرة جدير تتسرب فيها ضغطة تانية قبل ما الـ re-render يحصل
  const promoRequestInFlight = useRef(false)

  // Sync form fields from logged-in user (derived state during render, no effect)
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id)
    if (user.name)  setName(user.name)
    if (user.email) setEmail(user.email)
    if (user.phone) setPhone(user.phone)
  }

  // Reset promo when phone changes (derived state during render, no effect)
  const [lastPromoPhone, setLastPromoPhone] = useState(phone)
  if (phone !== lastPromoPhone) {
    setLastPromoPhone(phone)
    if (promoApplied) {
      setPromoApplied("")
      setPromoDiscount(0)
      setPromoSuccess("")
      setPromoError("Phone changed — please re-apply your promo code")
    }
  }

  // للحالة البصرية بتاعة نسخة الديسكتوب من الـ promo card (spinner وقت التحميل، checkmark
  // لحظة القبول، shake لحظة الرفض) — نفس المنطق المستخدم في Promocard.tsx بتاع
  // الموبايل
  const [promoJustApplied, setPromoJustApplied] = useState(false)
  const [promoShake, setPromoShake] = useState(false)
  useEffect(() => {
    if (promoApplied) {
      setPromoJustApplied(true)
      const t = setTimeout(() => setPromoJustApplied(false), 700)
      return () => clearTimeout(t)
    }
  }, [promoApplied])
  useEffect(() => {
    if (promoError) {
      setPromoShake(true)
      const t = setTimeout(() => setPromoShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [promoError])

  // الهدايا خلاص اتختارت في صفحة المنتج — هنا بس عرض
  const validGifts = useMemo(() => gifts.filter((g) => g && g.variantId), [gifts])

  const subtotal      = total()
  // قيمة الهدية للعرض بس (كام العميل وفر) — مش بتتطرح من subtotal لأنها أصلاً مش داخلة فيه
  const giftDisplayValue = validGifts.reduce((sum, g) => {
    const referenceItem = items.find((i) => i.color === g.color && i.size === g.size) || items[0]
    return sum + (referenceItem?.price || 0)
  }, 0)
  const discountValue = promoApplied ? Math.round((subtotal * promoDiscount) / 100) : 0
  const amountAfterDiscounts = subtotal - discountValue
  const shippingCost   = getFinalShippingCost(zone, amountAfterDiscounts)
  const isFreeShipping = FREE_SHIPPING_THRESHOLD !== null && amountAfterDiscounts >= FREE_SHIPPING_THRESHOLD
  const finalTotal      = subtotal - discountValue + shippingCost

  const handleApplyPromo = async () => {
    // قفل فوري — لو فيه طلب ماشي دلوقتي، منقبلش نعمل تاني مهما اليوزر داس كتير
    if (promoRequestInFlight.current) return
    const code = promoInput.trim().toUpperCase()
    if (!code) { setPromoError("Enter a promo code"); return }
    if (!phone.trim()) { setPromoError("Enter your phone number first"); return }

    promoRequestInFlight.current = true
    setPromoLoading(true)
    setPromoError("")
    setPromoSuccess("")

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ code, phone: phone.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        // رسالة الـ rate limit (429) مش مفروض العميل يشوفها في الاستخدام الطبيعي —
        // بما إن الـ debounce فوق بيمنع الضغط المتكرر من الأساس، لو الحالة دي طلعت
        // فعليًا معناها اليوزر فعلاً بيحاول يلف الموقع (multiple tabs، refresh، إلخ)، فبنعرض
        // له رسالة محايدة مش رسالة تقنية عن محاولات
        setPromoError(res.status === 429 ? "Please wait a moment and try again" : (data.error || "Invalid promo code"))
        setPromoApplied("")
        setPromoDiscount(0)
        return
      }
      setPromoApplied(data.code)
      setPromoDiscount(data.discount)
      setPromoSuccess(`${data.discount}% discount applied!`)
    } catch {
      setPromoError("Something went wrong")
    } finally {
      promoRequestInFlight.current = false
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied("")
    setPromoDiscount(0)
    setPromoInput("")
    setPromoSuccess("")
    setPromoError("")
  }

  const handlePromoInputChange = (v: string) => {
    setPromoInput(v)
    setPromoError("")
  }

  // ─── Meta Pixel: InitiateCheckout ───────────────────────────────────────
  // بيتبعت مرة واحدة لما العميل يوصل لصفحة الـ checkout ومعاه حاجة في الكارت
  const trackedCheckoutRef = useRef(false)
  useEffect(() => {
    if (trackedCheckoutRef.current) return
    if (items.length === 0) return
    trackedCheckoutRef.current = true
    trackInitiateCheckout({
      content_ids: items.map((i) => i.variantId),
      value: subtotal,
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (items.length === 0) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "24px" }}>Your cart is empty</p>
      <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px" }}>Shop Now</Link>
    </div>
  )

  const handleOrder = async () => {
    if (loading) return

    const trimmedName    = name.trim()
    const trimmedEmail   = email.trim()
    const trimmedPhone   = phone.trim()
    const trimmedAddress = address.trim()

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      setError("Please fill in all required fields")
      return
    }
    if (!city) {
      setError("Please select your city")
      return
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address")
      return
    }
    if (!/^01[0-9]{9}$/.test(trimmedPhone)) {
      setError("Please enter a valid Egyptian phone number (01XXXXXXXXX)")
      return
    }

    setLoading(true)
    setError("")

    // event_id واحد لكل محاولة أوردر — بيتبعت للسيرفر عشان الـ CAPI Purchase
    // يستخدم نفسه، فـ Meta تعمل dedup صح بين الـ Pixel (browser) والـ CAPI (server)
    const purchaseEventId = generateEventId()

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          giftSelections: validGifts.map((g) => ({ variantId: g.variantId })),
          address: trimmedAddress,
          city,
          phone: trimmedPhone,
          email: trimmedEmail,
          name: trimmedName,
          clientOrderId,
          paymentMethod: payment,
          shippingZone: zone,
          promoCode: promoApplied || undefined,
          eventId: purchaseEventId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      const contentIds = items.map((i) => i.variantId)
      const numItems = items.reduce((sum, i) => sum + i.quantity, 0)

      clearCart()

      if (payment === "instapay") {
        // الـ Purchase الحقيقي لطلبات InstaPay بيتبعت بعد ما العميل يدخل رقم
        // الحوالة (submit-instapay-ref) — مش هنا، عشان لسه مافيش نية دفع جادة
        saveGuestOrderToken(data.id, data.verifyToken)
        router.push(`/instapay-payment/${data.id}?token=${data.verifyToken}&eid=${purchaseEventId}`)
      } else {
        // COD: الأوردر اتأكد فعليًا في نفس اللحظة — ابعت الـ Purchase دلوقتي
        trackPurchase({
          content_ids: contentIds,
          value: finalTotal,
          num_items: numItems,
          eventId: purchaseEventId,
        })
        // ربط الـ Clarity session الحالية برقم الأوردر/الفاتورة — نفس اللحظة اللي بيتبعت
        // فيها الـ Purchase لـ Meta، عشان تقدر تدور في Clarity برقم الأوردر وتلاقي
        // الـ session بتاعت العميل ده بالظبط
        tagClarityOrder({
          orderRef: data.id,
          invoiceNumber: data.invoiceNumber ? `INV-${String(data.invoiceNumber).padStart(4, "0")}` : undefined,
        })
        if (user) {
          router.push("/orders")
        } else {
          router.push(`/order-confirmed?email=${encodeURIComponent(trimmedEmail)}`)
        }
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const ctaLabel = loading ? "Please wait..." : payment === "cod" ? "Place Order" : "Continue to Payment"

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        * { box-sizing: border-box; }
        .checkout-mobile-view { display: block; }
        .checkout-desktop-view { display: none; }
        @media (min-width: 860px) {
          .checkout-mobile-view { display: none !important; }
          .checkout-desktop-view { display: block !important; }
        }
        @keyframes promo-spin { to { transform: rotate(360deg); } }
        @keyframes promo-check-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes promo-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        .promo-checkmark-desktop { animation: promo-check-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .promo-shake-desktop { animation: promo-shake 0.45s ease; }
      `}</style>

      {/* ============================= MOBILE (< 860px) ============================= */}
      <div className="checkout-mobile-view" style={{ overflowX: "hidden" }}>
        <div style={{ padding: "28px 20px 24px" }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "34px", fontWeight: 300, letterSpacing: "-0.01em", marginBottom: "8px", color: "#f0ede6" }}>
            Checkout
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.01em", marginBottom: "28px", lineHeight: 1.5 }}>
            Complete your order in less than a minute.
          </p>

          {/* Mini sticky summary */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(240,237,230,0.14)",
              borderRadius: "16px", padding: "16px 18px", marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>{finalTotal}</span>
                <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
              </div>
              <div style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.45)", letterSpacing: "0.02em" }}>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
                {` · Shipping ${isFreeShipping ? "Free" : `${shippingCost} EGP`}`}
                {promoApplied && ` · ${promoDiscount}% off`}
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              style={{ fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "0.08em", color: "rgba(240,237,230,0.85)", background: "transparent", border: "none", display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", padding: "8px 4px" }}
            >
              View items
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <CheckoutCard step={1} done title="Contact">
            <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="your@email.com" hint="Order updates will be sent here — no account needed." />
          </CheckoutCard>

          <CheckoutCard step={2} title="Delivery">
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <InputField label="Full name" value={name} onChange={setName} />
              <InputField label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" />
              <div>
                <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.7)", marginBottom: "8px", display: "block" }}>City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: "100%", padding: "13px 14px", background: "#0d0d0d", border: "1px solid rgba(240,237,230,0.2)", color: city ? "#f0ede6" : "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box", appearance: "none" }}
                >
                  <option value="" disabled>Select your city</option>
                  {BOSTA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <InputField label="Delivery address" value={address} onChange={setAddress} multiline rows={3} placeholder="Street, area, building, floor" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "14px", border: "1.5px solid rgba(240,237,230,0.14)", background: "rgba(255,255,255,0.015)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "14.5px", letterSpacing: "0.01em" }}>Standard Delivery</span>
                  <span style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.4)" }}>Shipping all over Egypt · 2–4 business days</span>
                </div>
                <span style={{ fontSize: "14px", color: "rgba(240,237,230,0.9)", flexShrink: 0 }}>{SHIPPING_RATES.egypt} EGP</span>
              </div>
            </div>
          </CheckoutCard>

          <CheckoutCard step={3} title="Payment method">
            <PaymentCard options={paymentMethods} selected={payment} onSelect={setPayment} />
            {payment === "instapay" && (
              <p style={{ marginTop: "14px", padding: "14px 16px", borderRadius: "12px", background: "rgba(240,237,230,0.03)", border: "1px solid rgba(240,237,230,0.1)", fontSize: "11px", color: "rgba(240,237,230,0.55)", lineHeight: 1.65 }}>
                After placing your order, you&apos;ll be taken to a payment page with our InstaPay number and the exact amount. You&apos;ll transfer and enter your transaction reference there.
              </p>
            )}
          </CheckoutCard>

          <CheckoutCard step={4} title="Promo code">
            <PromoCard
              promoInput={promoInput}
              onPromoInputChange={handlePromoInputChange}
              promoApplied={promoApplied}
              promoDiscount={promoDiscount}
              promoLoading={promoLoading}
              promoError={promoError}
              promoSuccess={promoSuccess}
              onApply={handleApplyPromo}
              onRemove={handleRemovePromo}
            />
          </CheckoutCard>

          <div style={{ height: "8px" }} />
        </div>

        <StickyCheckoutBar total={finalTotal} loading={loading} ctaLabel={ctaLabel} onSubmit={handleOrder} error={error} />

        <OrderSummarySheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <OrderSummaryBody
            items={items}
            gifts={validGifts}
            giftDisplayValue={giftDisplayValue}
            subtotal={subtotal}
            discountValue={discountValue}
            shippingCost={shippingCost}
            shippingLabel={SHIPPING_LABELS[zone]}
            isFreeShipping={isFreeShipping}
            finalTotal={finalTotal}
            promoInput={promoInput}
            onPromoInputChange={handlePromoInputChange}
            promoApplied={promoApplied}
            promoDiscount={promoDiscount}
            promoLoading={promoLoading}
            promoError={promoError}
            promoSuccess={promoSuccess}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
          />
        </OrderSummarySheet>
      </div>

      {/* ============================= DESKTOP (>= 860px) — unchanged, plain JSX like the original ============================= */}
      <div className="checkout-desktop-view">
        <div style={{ maxWidth: "1020px", margin: "0 auto", padding: "48px 24px 100px" }}>

          <p style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "8px" }}>Almost there</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "38px", fontWeight: 300, color: "#f0ede6", marginBottom: "20px", letterSpacing: "-0.01em" }}>Checkout</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "44px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.5)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(240,237,230,0.5)" }} />Cart
            </span>
            <span style={{ flex: 1, maxWidth: "40px", height: "1px", background: "rgba(240,237,230,0.1)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.85)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f0ede6" }} />Details
            </span>
            <span style={{ flex: 1, maxWidth: "40px", height: "1px", background: "rgba(240,237,230,0.1)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.3)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(240,237,230,0.25)" }} />Confirm
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "64px", alignItems: "start" }}>

            <div>
              {/* Section 1 — Contact */}
              <div style={{ padding: "0 0 32px", marginBottom: "32px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>01</span>
                  <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Contact</span>
                </div>
                <div>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: "100%", padding: "13px 14px", background: "transparent", border: "1px solid rgba(240,237,230,0.18)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
                  <p style={{ fontSize: "8.5px", color: "rgba(240,237,230,0.4)", marginTop: "7px", letterSpacing: "0.04em", lineHeight: 1.6 }}>Order updates will be sent to this email — no account needed</p>
                </div>
              </div>

              {/* Section 2 — Delivery */}
              <div style={{ padding: "0 0 32px", marginBottom: "32px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>02</span>
                  <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Delivery</span>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Full name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "13px 14px", background: "transparent", border: "1px solid rgba(240,237,230,0.18)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Phone *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" style={{ width: "100%", padding: "13px 14px", background: "transparent", border: "1px solid rgba(240,237,230,0.18)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: "100%", padding: "13px 14px", background: "#0d0d0d", border: "1px solid rgba(240,237,230,0.18)", color: city ? "#f0ede6" : "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box", appearance: "none" }}
                  >
                    <option value="" disabled>Select your city</option>
                    {BOSTA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Delivery address *</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, Area, Building, Floor" style={{ width: "100%", padding: "13px 14px", background: "transparent", border: "1px solid rgba(240,237,230,0.18)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box", resize: "none" }} />
                </div>

                <div>
                  <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Delivery</label>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", border: "1px solid rgba(240,237,230,0.18)" }}>
                    <span style={{ fontSize: "11px", letterSpacing: "0.05em" }}>Standard Delivery — all over Egypt</span>
                    <span style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.85)", flexShrink: 0 }}>{SHIPPING_RATES.egypt} EGP</span>
                  </div>
                  <p style={{ fontSize: "8.5px", color: "rgba(240,237,230,0.4)", marginTop: "7px", letterSpacing: "0.04em", lineHeight: 1.6 }}>2–4 business days</p>
                </div>
              </div>

              {/* Section 3 — Payment */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>03</span>
                  <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Payment method</span>
                </div>
                <div style={{ border: "1px solid rgba(240,237,230,0.18)" }}>
                  {paymentMethods.map((m) => {
                    const isSelected = payment === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPayment(m.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: isSelected ? "rgba(240,237,230,0.05)" : "transparent", border: "none", borderBottom: "1px solid rgba(240,237,230,0.1)", color: "#f0ede6", cursor: "pointer", fontFamily: "Space Mono, monospace", textAlign: "left" }}
                      >
                        <span style={{ width: "15px", height: "15px", borderRadius: "50%", border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f0ede6" }} />}
                        </span>
                        <span style={{ flex: 1 }}>
                          <p style={{ fontSize: "11.5px", color: "#f0ede6", margin: 0, letterSpacing: "0.03em" }}>{m.label}</p>
                          <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.45)", margin: "3px 0 0", letterSpacing: "0.03em" }}>{m.sub}</p>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {payment === "instapay" && (
                  <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.03em", lineHeight: 1.75, marginTop: "16px", padding: "15px 16px", borderLeft: "1px solid rgba(240,237,230,0.25)" }}>
                    After placing your order, you&apos;ll be taken to a payment page with our InstaPay number and the exact amount. You&apos;ll transfer and enter your transaction reference there.
                  </p>
                )}

                {error && <p style={{ fontSize: "10px", color: "#ff6b6b", marginTop: "16px", letterSpacing: "0.1em" }}>{error}</p>}
              </div>
            </div>

            {/* Desktop Order Summary */}
            <div style={{ border: "1px solid rgba(240,237,230,0.15)", padding: "26px", position: "sticky", top: "80px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", marginBottom: "20px" }}>Order summary</p>

              {items.map((item) => (
                <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{item.productName}</p>
                    <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.45)", marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.color} / {item.size} × {item.quantity}</p>
                  </div>
                  <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)", whiteSpace: "nowrap" }}>{item.price * item.quantity} EGP</p>
                </div>
              ))}

              {validGifts.map((g, idx) => (
                <div key={`gift-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{g.productName}</p>
                    <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.6)", marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{g.color} / {g.size} — Gift</p>
                  </div>
                  <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)", whiteSpace: "nowrap" }}>Free</p>
                </div>
              ))}

              <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px", marginTop: "8px", marginBottom: "18px" }}>
                <label style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "8px", display: "block" }}>Promo code</label>

                {!promoApplied ? (
                  <div
                    className={promoShake ? "promo-shake-desktop" : undefined}
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="...."
                      disabled={promoLoading}
                      style={{
                        flex: 1, padding: "12px 14px", background: "transparent",
                        border: `1px solid ${promoError ? "rgba(255,107,107,0.5)" : "rgba(240,237,230,0.18)"}`,
                        color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "11px",
                        outline: "none", letterSpacing: "0.1em", transition: "border-color 0.25s ease",
                      }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                      style={{
                        width: "64px", padding: "0", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase",
                        fontFamily: "Space Mono, monospace", background: "transparent", color: "rgba(240,237,230,0.75)",
                        border: "1px solid rgba(240,237,230,0.25)", cursor: promoLoading ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: promoLoading ? 0.6 : 1, transition: "opacity 0.2s ease",
                      }}
                    >
                      {promoLoading ? (
                        <span style={{ display: "inline-block", width: "12px", height: "12px", border: "1.5px solid rgba(240,237,230,0.25)", borderTopColor: "#f0ede6", borderRadius: "50%", animation: "promo-spin 0.6s linear infinite" }} />
                      ) : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px",
                      border: `1px solid ${promoJustApplied ? "rgba(200,240,79,0.5)" : "rgba(240,237,230,0.3)"}`,
                      background: promoJustApplied ? "rgba(200,240,79,0.08)" : "rgba(240,237,230,0.05)",
                      transition: "background 0.4s ease, border-color 0.4s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        className={promoJustApplied ? "promo-checkmark-desktop" : undefined}
                        style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, background: "#c8f04f", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                          <path d="M5 13l4 4L19 7" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.9)", letterSpacing: "0.15em", fontFamily: "Space Mono, monospace" }}>{promoApplied}</p>
                        <p style={{ fontSize: "9px", color: "rgba(200,240,79,0.75)", marginTop: "2px", letterSpacing: "0.05em" }}>{promoDiscount}% off applied</p>
                      </div>
                    </div>
                    <button onClick={handleRemovePromo} style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", letterSpacing: "0.1em" }}>Remove</button>
                  </div>
                )}

                {promoError && <p style={{ fontSize: "9px", color: "#ff6b6b", marginTop: "8px", letterSpacing: "0.05em" }}>{promoError}</p>}
              </div>

              <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Subtotal</span>
                  <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.7)" }}>{subtotal} EGP</span>
                </div>

                {validGifts.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
                    <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Free gift ({validGifts.length}x)</span>
                    <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.7)" }}>Worth {giftDisplayValue} EGP</span>
                  </div>
                )}

                {promoApplied && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
                    <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Discount ({promoDiscount}%)</span>
                    <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)" }}>− {discountValue} EGP</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Shipping ({SHIPPING_LABELS[zone]})</span>
                  <span style={{ fontSize: "11px", color: isFreeShipping ? "#c8f04f" : "rgba(240,237,230,0.7)" }}>
                    {isFreeShipping ? "Free" : `${shippingCost} EGP`}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(240,237,230,0.08)" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Total</span>
                  <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "30px", color: "#f0ede6" }}>{finalTotal} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.45)" }}>EGP</span></span>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={loading}
                style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginTop: "22px", marginBottom: "18px" }}
              >
                {ctaLabel}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["Secure", "Egypt Only", "Easy Returns"].map((t) => (
                  <p key={t} style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}