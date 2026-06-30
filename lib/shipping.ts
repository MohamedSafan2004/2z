export type ShippingZone = "cairo" | "giza"

export const SHIPPING_RATES: Record<ShippingZone, number> = {
  cairo: 80,
  giza: 50,
}

export const SHIPPING_LABELS: Record<ShippingZone, string> = {
  cairo: "Cairo",
  giza: "Giza",
}

export function getShippingCost(zone: string | null | undefined): number {
  if (zone === "cairo" || zone === "giza") return SHIPPING_RATES[zone]
  return 0
}