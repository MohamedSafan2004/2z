"use client"

import PromoCard from "./Promocard"

interface CartItemLike {
  variantId: string
  productName: string
  color: string
  size: string
  quantity: number
  price: number
}

interface GiftItemLike {
  productName: string
  color: string
  size: string
}

interface OrderSummaryBodyProps {
  items: CartItemLike[]
  gifts: GiftItemLike[]
  giftDisplayValue: number
  subtotal: number
  discountValue: number
  discountPercent: number
  discountLabel: string
  shippingCost: number
  shippingLabel: string
  isFreeShipping?: boolean
  finalTotal: number
  promoInput: string
  onPromoInputChange: (v: string) => void
  promoApplied: string
  promoDiscount: number
  promoLoading: boolean
  promoError: string
  promoSuccess: string
  onApplyPromo: () => void
  onRemovePromo: () => void
}

export default function OrderSummaryBody({
  items, gifts, giftDisplayValue, subtotal, discountValue, discountPercent, discountLabel, shippingCost, shippingLabel, isFreeShipping, finalTotal,
  promoInput, onPromoInputChange, promoApplied, promoDiscount, promoLoading, promoError, promoSuccess,
  onApplyPromo, onRemovePromo,
}: OrderSummaryBodyProps) {
  return (
    <>
      {items.map((item) => (
        <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "16px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{item.productName}</p>
            <p style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.45)", marginTop: "4px", letterSpacing: "0.03em" }}>
              {item.color} / {item.size} × {item.quantity}
            </p>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(240,237,230,0.85)", whiteSpace: "nowrap" }}>{item.price * item.quantity} EGP</p>
        </div>
      ))}

      {gifts.map((g, idx) => (
        <div key={`gift-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "16px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{g.productName}</p>
            <p style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.6)", marginTop: "4px", letterSpacing: "0.03em" }}>
              {g.color} / {g.size} — Gift
            </p>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(240,237,230,0.85)", whiteSpace: "nowrap" }}>Free</p>
        </div>
      ))}

      <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px", marginTop: "8px", marginBottom: "18px" }}>
        <PromoCard
          promoInput={promoInput}
          onPromoInputChange={onPromoInputChange}
          promoApplied={promoApplied}
          promoDiscount={promoDiscount}
          promoLoading={promoLoading}
          promoError={promoError}
          promoSuccess={promoSuccess}
          onApply={onApplyPromo}
          onRemove={onRemovePromo}
        />
      </div>

      <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.5)" }}>Subtotal</span>
          <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.7)" }}>{subtotal} EGP</span>
        </div>

        {gifts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.6)" }}>Free gift ({gifts.length}x)</span>
            <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.7)" }}>Worth {giftDisplayValue} EGP</span>
          </div>
        )}

        {discountValue > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.6)" }}>{discountLabel} ({discountPercent}%)</span>
            <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.8)" }}>− {discountValue} EGP</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12.5px", color: "rgba(240,237,230,0.5)" }}>Shipping {shippingLabel && `(${shippingLabel})`}</span>
          <span style={{ fontSize: "12.5px", color: isFreeShipping ? "#c8f04f" : "rgba(240,237,230,0.7)" }}>
            {shippingLabel ? (isFreeShipping ? "Free" : `${shippingCost} EGP`) : "—"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(240,237,230,0.1)" }}>
          <span style={{ fontSize: "12px", color: "rgba(240,237,230,0.5)" }}>Total</span>
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>
            {finalTotal} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.45)" }}>EGP</span>
          </span>
        </div>
      </div>
    </>
  )
}