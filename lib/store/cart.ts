import { create } from "zustand"
import { persist } from "zustand/middleware"

const MAX_QUANTITY = 99
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CartItem {
  variantId: string
  productName: string
  price: number
  color: string
  size: string
  quantity: number
  image?: string
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  expiresAt: number | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

const freshExpiry = () => Date.now() + CART_TTL_MS

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      expiresAt: null,

      addItem: (item) => {
        const items = get().items
        const existing = items.find((i) => i.variantId === item.variantId)

        if (existing) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, MAX_QUANTITY) }
                : i
            ),
            expiresAt: freshExpiry(),
          })
        } else {
          set({
            items: [...items, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) }],
            expiresAt: freshExpiry(),
          })
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) })
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity === 0) {
          get().removeItem(variantId)
          return
        }
        const clamped = Math.min(quantity, MAX_QUANTITY)
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clamped } : i
          ),
          expiresAt: freshExpiry(),
        })
      },

      clearCart: () => set({ items: [], expiresAt: null }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        // لو الكارت عدى عليه أكتر من 7 أيام من آخر تعديل، امسحه أوتوماتيك
        if (state && state.expiresAt && Date.now() > state.expiresAt) {
          state.items = []
          state.expiresAt = null
        }
      },
    }
  )
)