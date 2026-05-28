import { NextRequest, NextResponse } from "next/server"

const PREVIEW_SECRET = "2z-x9k#mP3q"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // اسمح للـ API routes والـ static files والـ coming-soon نفسها
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/coming-soon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // لو عنده الـ preview cookie اسمحله يعدي
  const previewCookie = req.cookies.get("preview_access")?.value
  if (previewCookie === PREVIEW_SECRET) {
    return NextResponse.next()
  }

  // لو جاي بالـ query param، حط الـ cookie واسمحله
  const previewParam = req.nextUrl.searchParams.get("preview")
  if (previewParam === PREVIEW_SECRET) {
    const res = NextResponse.next()
    res.cookies.set("preview_access", PREVIEW_SECRET, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // أسبوع
    })
    return res
  }

  // غير كده، redirect على coming-soon
  return NextResponse.redirect(new URL("/coming-soon", req.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}