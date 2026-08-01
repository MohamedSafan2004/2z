// المدن اللي Bosta بتغطيها فعليًا (city name المطلوب بالظبط في الـ API عندهم).
// المرجع: Bosta City List الرسمية. لو حبينا نضيف مدينة جديدة، ضيفها هنا بس —
// هتظهر تلقائيًا في الـ checkout وهتتبعت صح لـ Bosta.
export const BOSTA_CITIES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Qalyubia",
  "Dakahlia",
  "Sharqia",
  "Gharbia",
  "Monufia",
  "Beheira",
  "Kafr El Sheikh",
  "Damietta",
  "Port Said",
  "Ismailia",
  "Suez",
  "Fayoum",
  "Beni Suef",
  "Minya",
  "Assiut",
  "Sohag",
  "Qena",
  "Luxor",
  "Aswan",
  "Red Sea",
  "New Valley",
  "Matrouh",
  "North Sinai",
  "South Sinai",
] as const

export type BostaCity = (typeof BOSTA_CITIES)[number]

export function isValidBostaCity(value: unknown): value is BostaCity {
  return typeof value === "string" && (BOSTA_CITIES as readonly string[]).includes(value)
}
