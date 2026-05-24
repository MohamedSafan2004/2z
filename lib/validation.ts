export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string) {
  return /^01[0-9]{9}$/.test(phone)
}

export function validatePassword(password: string) {
  return password.length >= 8
}

export function sanitize(str: string) {
  return str.trim().replace(/[<>]/g, "")
}