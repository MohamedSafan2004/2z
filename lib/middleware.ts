import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"

export function requireAuth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return { error: NextResponse.json(
      { error: "Login required" },
      { status: 401 }
    )}
  }

  const payload = verifyToken(token)

  if (!payload) {
    return { error: NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    )}
  }

  return { userId: payload.userId, role: payload.role }
}

export function requireAdmin(req: NextRequest) {
  const auth = requireAuth(req)

  if ("error" in auth) return auth

  if (auth.role !== "ADMIN") {
    return { error: NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    )}
  }

  return auth
}

export function optionalAuth(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return { userId: null, role: "CUSTOMER" }
  const payload = verifyToken(token)
  if (!payload) return { userId: null, role: "CUSTOMER" }
  return { userId: payload.userId, role: payload.role }
}