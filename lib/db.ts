import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // مهم جداً: لازم DATABASE_URL (transaction pooler — بورت 6543) مش DIRECT_URL
  // (session pooler — بورت 5432). في serverless (Vercel)، كل function instance
  // بتفتح Pool خاص بيها، والـ session pooler بتاع Supabase محدود بـ 15 client
  // بس على مستوى المشروع كله — بيتاكل بسرعة مع أي زيارتين/تلاتة متزامنة
  // ويطلع (EMAXCONNSESSION). الـ transaction pooler مصمم بالظبط للحالة دي.
  // DIRECT_URL يفضل للاستخدام بس في سكريبتات prisma/*.ts اللي بتشتغل مرة واحدة
  // من التيرمينال (seed, backup, إلخ) مش في التطبيق اللايف.
  const connectionString =
    process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const pool = new Pool({
    connectionString,
    // max صغير عمدياً: في serverless كل function instance بتفتح Pool منفصلة،
    // فلو max كبير (10) والموقع بياخد زيارة معاملة، حتى transaction pooler
    // ممكن يتضغط. 3 كفاية للأداء وأمان أكتر بكتير.
    max: 3,
    idleTimeoutMillis: 30000,
    // 5 ثواني كانت قصيرة جداً وقت الـ build (npm run build) — بتعمل عدة
    // اتصالات متتالية بالـ Supabase pooler لكل صفحة بتحتاج بيانات، ولو فيه أي
    // بطء لحظي في الشبكة أو في الـ pooler نفسه بيفشل الاتصال بسرعة
    // ("Connection terminated due to connection timeout"). 15 ثانية كافية
    // كمساحة أمان من غير ما تأثر على السرعة الفعلية وقت التشغيل العادي
    // (لو الاتصال سليم بيتم في أجزاء من الثانية زي ما هو).
    connectionTimeoutMillis: 15000,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}