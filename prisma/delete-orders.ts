export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ─────────────────────────────────────────────────────────────────────
// بيمسح أوردرات محددة بالـ ID بأمان: يرجّع الستوك المخصوم (لو الأوردر لسه
// مش CANCELLED)، يمسح OrderItems وPromoCodeUsage المرتبطة، وبعدين الأوردر
// نفسه. بيعرض تفاصيل كل أوردر الأول قبل ما يمسح حاجة.
// ─────────────────────────────────────────────────────────────────────

const ORDER_IDS_TO_DELETE = [
  "cms69pqa9000004l4sl33c07n",
  "cms69jr7n000204l5phirclfc",
  "cms68zvrv000004l5rhnnzk9s",
]

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  for (const orderId of ORDER_IDS_TO_DELETE) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      console.log(`⚠ الأوردر ${orderId} مش موجود أصلاً — تخطي`)
      continue
    }

    console.log(`\n── الأوردر ${orderId} ──`)
    console.log(`  الحالة: ${order.status} | الدفع: ${order.paymentStatus} | المبلغ: ${order.totalAmount} EGP`)
    console.log(`  العميل: ${order.guestName || "—"} | ${order.guestEmail || "—"} | ${order.phone || "—"}`)
    console.log(`  عدد القطع: ${order.items.length}`)
    for (const item of order.items) {
      console.log(`    - ${item.productNameSnapshot} ${item.colorSnapshot}/${item.sizeSnapshot} × ${item.quantity} ${item.isGift ? "(هدية)" : ""}`)
    }

    // ─── استرجاع الستوك — بس لو الأوردر لسه مش CANCELLED (لو كان CANCELLED
    // الستوك اتسترجع بالفعل وقت الإلغاء، فمنرجعوش تاني عشان مايتضاعفش) ───
    if (order.status !== "CANCELLED") {
      for (const item of order.items) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      }
      console.log(`  ✓ الستوك اتسترجع (${order.items.length} صنف)`)
    } else {
      console.log(`  ℹ الأوردر كان CANCELLED بالفعل — الستوك متسترجعش تاني`)
    }

    // ─── مسح استخدام البرومو كود (لو موجود) — عشان العميل يقدر يستخدم
    // نفس الكود تاني لو الأوردر ده كان بيمنعه ───
    if (order.promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: order.promoCode } })
      if (promo && order.phone) {
        const deleted = await prisma.promoCodeUsage.deleteMany({
          where: { promoCodeId: promo.id, phone: order.phone },
        })
        if (deleted.count > 0) {
          console.log(`  ✓ استخدام الكود ${order.promoCode} اتمسح (${deleted.count})`)
        }
      }
    }

    // ─── مسح الـ OrderItems ثم الأوردر نفسه ───
    await prisma.orderItem.deleteMany({ where: { orderId } })
    await prisma.order.delete({ where: { id: orderId } })
    console.log(`  ✓ الأوردر اتمسح بالكامل`)
  }

  await pool.end()
  console.log("\n✅ خلصنا")
}

main().catch((err) => {
  console.error("❌ حصل خطأ:", err)
  process.exit(1)
})
