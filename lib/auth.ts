import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set")
}

const JWT_SECRET = process.env.JWT_SECRET as string

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, role: string, tokenVersion: number): string {
  return jwt.sign({ userId, role, tokenVersion }, JWT_SECRET, { expiresIn: "30d", algorithm: "HS256" })
}

export function verifyToken(token: string): { userId: string; role: string; tokenVersion: number } | null {
  try {
    // تحديد algorithm صراحة بيمنع algorithm confusion attack — التوكن مش مقبول
    // لو اتوقّع بأي algorithm تاني غير HS256، حتى لو التوقيع نفسه صح
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] })
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "role" in decoded) {
      return {
        userId: decoded.userId as string,
        role: decoded.role as string,
        // التوكنات القديمة اللي اتعملت قبل إضافة tokenVersion معندها 0 كـ default آمن
        tokenVersion: typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0,
      }
    }
    return null
  } catch {
    return null
  }
}