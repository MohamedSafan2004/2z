import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const path = require("path")

cloudinary.config(true)

// ─── الملفات اللي هنرفعها ──────────────────────────────────────────────
const UPLOADS = [
  {
    label: "Size Chart",
    filePath: "D:\\2Z\\Black and Gray Modern T-Shirt Size Chart Instagram Post.jpg",
    publicId: "2z-store/size-chart",
  },
  {
    label: "Collection Section (Home)",
    filePath: "D:\\2Z\\colors\\BA\\clo.JPG",
    publicId: "2z-store/collection-tee",
  },
]
// ────────────────────────────────────────────────────────────────────

async function uploadOne(filePath: string, publicId: string, label: string) {
  console.log(`\n📤 ${label}`)

  // نمسح النسخة القديمة الأول لو موجودة عشان الـ cache متتلخبطش
  try {
    const destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })
    console.log(`  🗑️  مسح القديم: ${destroyResult.result}`)
  } catch {
    console.log(`  (مفيش نسخة قديمة بنفس الاسم، عادي)`)
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId, // فيه المسار "2z-store/" جواه بالفعل — من غير folder param عشان منكررش المسار
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    })
    console.log(`  ✓ نجح → ${result.secure_url}`)
    return result.secure_url
  } catch (error: any) {
    console.log(`  ✗ فشل: ${error.message}`)
    return null
  }
}

async function main() {
  const results: Record<string, string | null> = {}

  for (const item of UPLOADS) {
    results[item.publicId] = await uploadOne(item.filePath, item.publicId, item.label)
  }

  console.log("\n\n✅ الروابط الجاهزة:\n")
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)