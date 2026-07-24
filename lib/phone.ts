// Egyptian phone numbers only — strips leading +2 or 2 country code
// Normalizes to 01XXXXXXXXX (11 digits) so the same number in different
// formats (e.g. "+201012345678" vs "01012345678") is treated as identical.
// IMPORTANT: this must be the single source of truth — any code path that
// stores or compares a customer phone number for uniqueness (promo usage,
// order lookups, etc.) should normalize through this function first.
export function normalizeEgyptianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("20") && digits.length === 12) return digits.slice(2) // 20 1012345678 → 01012345678
  if (digits.startsWith("01") && digits.length === 11) return digits
  return null
}
