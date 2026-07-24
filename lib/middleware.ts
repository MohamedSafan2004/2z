import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"
import { db } from "./db"

type AuthSuccess = { userId: string; role: string }
type AuthError   = { error: NextResponse }
type OptionalAuth = { userId: string | null; role: string }

// استخراج الـ token من الـ Authorization header بشكل آمن
// بنتحقق إن الـ format صح "Bearer <token>" مش بس string replacement
function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization")
  if (!header) return null

  const parts = header.split(" ")
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null

  const token = parts[1].trim()
  if (!token) return null

  return token
}

export async function requireAuth(req: NextRequest): Promise<AuthSuccess | AuthError> {
  const token = extractBearerToken(req)

  if (!token) {
    return {
      error: NextResponse.json({ error: "Login required" }, { status: 401 }),
    }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    }
  }

  // نتأكد إن التوكن لسه صالح مقارنة بـ tokenVersion الحالي في الداتابيز — لو اليوزر
  // غير الباسورد (أو الأدمن عمل force logout)، tokenVersion بيتزود في الداتابيز
  // فأي توكن قديم معنده رقم أقدم يبقى مرفوض فورًا
  const user = await db.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true } })
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return {
      error: NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 }),
    }
  }

  return { userId: payload.userId, role: payload.role }
}

export async function requireAdmin(req: NextRequest): Promise<AuthSuccess | AuthError> {
  const auth = await requireAuth(req)
  if ("error" in auth) return auth

  if (auth.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  return auth
}

export function optionalAuth(req: NextRequest): OptionalAuth {
  const token = extractBearerToken(req)
  if (!token) return { userId: null, role: "CUSTOMER" }

  const payload = verifyToken(token)
  if (!payload) return { userId: null, role: "CUSTOMER" }

  return { userId: payload.userId, role: payload.role }
}