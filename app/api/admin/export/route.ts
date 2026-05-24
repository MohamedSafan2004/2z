import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import ExcelJS from "exceljs"

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const orders = await db.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })

    type Order = typeof orders[0]
    type Item = Order["items"][0]

    const wb = new ExcelJS.Workbook()
    wb.creator = "2Z Store"
    wb.created = new Date()

    const statusColors: Record<string, string> = {
      PENDING: "FFFEF3C7",
      PAID: "FFD1FAE5",
      SHIPPED: "FFDBEAFE",
      DELIVERED: "FFD1FAE5",
      CANCELLED: "FFFEE2E2",
    }

    const statusAr: Record<string, string> = {
      PENDING: "قيد الانتظار",
      PAID: "مدفوع",
      SHIPPED: "تم الشحن",
      DELIVERED: "تم التسليم",
      CANCELLED: "ملغي",
    }

    const paymentAr: Record<string, string> = {
      PENDING: "قيد الانتظار",
      PAID: "مدفوع",
      FAILED: "فشل",
    }

    // ===== Sheet 1: الأوردرات =====
    const ws1 = wb.addWorksheet("الأوردرات")
    ws1.columns = [
      { header: "رقم الأوردر", key: "id", width: 14 },
      { header: "التاريخ", key: "date", width: 14 },
      { header: "العميل", key: "customer", width: 22 },
      { header: "الإيميل", key: "email", width: 28 },
      { header: "التليفون", key: "phone", width: 16 },
      { header: "الإجمالي (EGP)", key: "total", width: 16 },
      { header: "الحالة", key: "status", width: 14 },
      { header: "الدفع", key: "payment", width: 14 },
      { header: "المنتجات", key: "items", width: 50 },
    ]

    ws1.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } }
      cell.font = { bold: true, color: { argb: "FFF0EDE6" }, size: 11 }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = { bottom: { style: "thin", color: { argb: "FF333333" } } }
    })
    ws1.getRow(1).height = 30

    orders.forEach((o: Order, i: number) => {
      const row = ws1.addRow({
        id: o.id.slice(0, 8).toUpperCase(),
        date: new Date(o.createdAt).toLocaleDateString("ar-EG"),
        customer: o.user?.name || "زبون",
        email: o.user?.email || o.guestEmail || "",
        phone: o.user?.phone || "",
        total: Number(o.totalAmount),
        status: statusAr[o.status] || o.status,
        payment: paymentAr[o.paymentStatus] || o.paymentStatus,
        items: o.items.map((item: Item) => `${item.productNameSnapshot} ${item.colorSnapshot} ${item.sizeSnapshot} x${item.quantity}`).join(" | "),
      })
      const bgColor = i % 2 === 0 ? "FFFAFAF9" : "FFFFFFFF"
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { size: 10 }
      })
      const statusCell = row.getCell("status")
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColors[o.status] || "FFFFFFFF" } }
      statusCell.font = { bold: true, size: 10 }
      row.height = 25
    })

    // ===== Sheet 2: الملخص =====
    const ws2 = wb.addWorksheet("الملخص")
    ws2.columns = [
      { header: "المقياس", key: "metric", width: 30 },
      { header: "القيمة", key: "value", width: 20 },
    ]
    ws2.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } }
      cell.font = { bold: true, color: { argb: "FFF0EDE6" }, size: 11 }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })
    ws2.getRow(1).height = 30

    const totalRevenue = orders
      .filter((o: Order) => o.status === "PAID" || o.status === "DELIVERED")
      .reduce((sum: number, o: Order) => sum + Number(o.totalAmount), 0)

    const productCount: Record<string, number> = {}
    const colorCount: Record<string, number> = {}
    const sizeCount: Record<string, number> = {}

    orders.forEach((o: Order) => {
      o.items.forEach((item: Item) => {
        productCount[item.productNameSnapshot] = (productCount[item.productNameSnapshot] || 0) + item.quantity
        colorCount[item.colorSnapshot] = (colorCount[item.colorSnapshot] || 0) + item.quantity
        sizeCount[item.sizeSnapshot] = (sizeCount[item.sizeSnapshot] || 0) + item.quantity
      })
    })

    const summaryRows = [
      { metric: "إجمالي الأوردرات", value: orders.length },
      { metric: "إجمالي الإيرادات (EGP)", value: totalRevenue },
      { metric: "متوسط قيمة الأوردر (EGP)", value: orders.length ? Math.round(totalRevenue / orders.length) : 0 },
      { metric: "أوردرات قيد الانتظار", value: orders.filter((o: Order) => o.status === "PENDING").length },
      { metric: "أوردرات تم التسليم", value: orders.filter((o: Order) => o.status === "DELIVERED").length },
      { metric: "أوردرات ملغية", value: orders.filter((o: Order) => o.status === "CANCELLED").length },
      { metric: "", value: "" },
      { metric: "--- أكثر المنتجات مبيعاً ---", value: "" },
      ...Object.entries(productCount).sort((a, b) => b[1] - a[1]).map(([name, qty]) => ({ metric: name, value: qty })),
      { metric: "", value: "" },
      { metric: "--- الألوان ---", value: "" },
      ...Object.entries(colorCount).sort((a, b) => b[1] - a[1]).map(([color, qty]) => ({ metric: color, value: qty })),
      { metric: "", value: "" },
      { metric: "--- المقاسات ---", value: "" },
      ...Object.entries(sizeCount).sort((a, b) => b[1] - a[1]).map(([size, qty]) => ({ metric: size, value: qty })),
    ]

    summaryRows.forEach((r, i) => {
      const row = ws2.addRow(r)
      const bgColor = i % 2 === 0 ? "FFFAFAF9" : "FFFFFFFF"
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.font = { size: 10 }
      })
      if (String(r.metric).startsWith("---")) {
        row.eachCell((cell) => {
          cell.font = { bold: true, size: 10, color: { argb: "FF374151" } }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
        })
      }
      row.height = 22
    })

// ===== Sheet 3: الإيرادات اليومية =====
    const ws3 = wb.addWorksheet("الإيرادات اليومية")
    ws3.columns = [
      { header: "التاريخ", key: "date", width: 16 },
      { header: "عدد الأوردرات", key: "orders", width: 16 },
      { header: "الإيرادات (EGP)", key: "revenue", width: 18 },
      { header: "المنتجات المباعة", key: "products", width: 60 },
    ]
    ws3.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } }
      cell.font = { bold: true, color: { argb: "FFF0EDE6" }, size: 11 }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })
    ws3.getRow(1).height = 30

    const dailyData2: Record<string, { revenue: number; orders: number; products: Record<string, { qty: number; revenue: number }> }> = {}
    orders
      .filter((o: Order) => o.status === "PAID" || o.status === "DELIVERED")
      .forEach((o: Order) => {
        const date = new Date(o.createdAt).toLocaleDateString("ar-EG")
        if (!dailyData2[date]) dailyData2[date] = { revenue: 0, orders: 0, products: {} }
        dailyData2[date].revenue += Number(o.totalAmount)
        dailyData2[date].orders++
        o.items.forEach((item: Item) => {
          const key = `${item.productNameSnapshot} (${item.colorSnapshot})`
          if (!dailyData2[date].products[key]) dailyData2[date].products[key] = { qty: 0, revenue: 0 }
          dailyData2[date].products[key].qty += item.quantity
          dailyData2[date].products[key].revenue += Number(item.priceSnapshot) * item.quantity
        })
      })

    Object.entries(dailyData2).forEach(([date, data], i) => {
      const productsStr = Object.entries(data.products)
        .map(([name, d]) => `${name} × ${d.qty} = ${d.revenue} EGP`)
        .join(" | ")
      const row = ws3.addRow({ date, orders: data.orders, revenue: data.revenue, products: productsStr })
      const bgColor = i % 2 === 0 ? "FFFAFAF9" : "FFFFFFFF"
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.font = { size: 10 }
      })
      row.height = 35
    })

    // ===== Sheet 4: الإيرادات الشهرية =====
    const ws4 = wb.addWorksheet("الإيرادات الشهرية")
    ws4.columns = [
      { header: "الشهر", key: "month", width: 20 },
      { header: "عدد الأوردرات", key: "count", width: 18 },
      { header: "الإيرادات (EGP)", key: "revenue", width: 20 },
      { header: "المنتجات المباعة", key: "products", width: 70 },
    ]
    ws4.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } }
      cell.font = { bold: true, color: { argb: "FFF0EDE6" }, size: 11 }
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })
    ws4.getRow(1).height = 30

    const monthlyData: Record<string, { count: number; revenue: number; products: Record<string, { qty: number; revenue: number }> }> = {}
    orders
      .filter((o: Order) => o.status === "PAID" || o.status === "DELIVERED")
      .forEach((o: Order) => {
        const d = new Date(o.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (!monthlyData[key]) monthlyData[key] = { count: 0, revenue: 0, products: {} }
        monthlyData[key].count++
        monthlyData[key].revenue += Number(o.totalAmount)
        o.items.forEach((item: Item) => {
          const pKey = `${item.productNameSnapshot} (${item.colorSnapshot})`
          if (!monthlyData[key].products[pKey]) monthlyData[key].products[pKey] = { qty: 0, revenue: 0 }
          monthlyData[key].products[pKey].qty += item.quantity
          monthlyData[key].products[pKey].revenue += Number(item.priceSnapshot) * item.quantity
        })
      })

    const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]

    Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, data], i) => {
        const [year, m] = month.split("-")
        const monthLabel = `${monthNames[parseInt(m) - 1]} ${year}`
        const productsStr = Object.entries(data.products)
          .map(([name, d]) => `${name} × ${d.qty} = ${d.revenue} EGP`)
          .join(" | ")
        const row = ws4.addRow({ month: monthLabel, count: data.count, revenue: data.revenue, products: productsStr })
        const bgColor = i % 2 === 0 ? "FFFAFAF9" : "FFFFFFFF"
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } }
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
          cell.font = { size: 10 }
        })
        row.height = 35
      })

    const buffer = await wb.xlsx.writeBuffer()
    const date = new Date().toISOString().split("T")[0]

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="2Z-Report-${date}.xlsx"`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}