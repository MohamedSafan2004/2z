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

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "role" in decoded) {
      return { userId: decoded.userId as string, role: decoded.role as string }
    }
    return null
  } catch {
    return null
  }
}