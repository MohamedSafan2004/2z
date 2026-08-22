import * as dotenv from "dotenv"
dotenv.config()

import { v2 as cloudinary } from "cloudinary"
import * as path from "path"
import * as fs from "fs"

cloudinary.config(true)

// ─── الفولدر اللي فيه الصور الجديدة ─────────────────────────────────────────
const IMAGES_FOLDER = path.join(__dirname, "..", "2z-new-images")

// بيطلع رسالة error واضحة مهما كان شكل error object اللي Cloudinary SDK بيرجعه
// (مش دايماً instanceof Error قياسي)
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const anyErr = error as Record<string, unknown>
    if (typeof anyErr.message === "string") return anyErr.message
    if (anyErr.error && typeof anyErr.error === "object") {
      const inner = anyErr.error as Record<string, unknown>
      if (typeof inner.message === "string") return inner.message
    }
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

async function uploadOne(filename: string, publicId: string, label: string) {
  console.log(`\n📤 برفع ${label} → ${publicId}...`)
  const filePath = path.join(IMAGES_FOLDER, filename)

  if (!fs.existsSync(filePath)) {
    console.log(`✗ الملف مش موجود: ${filePath}`)
    return false
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "2z-store",
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    })
    console.log(`✓ نجح → ${result.secure_url}`)
    return true
  } catch (error) {
    console.log(`✗ فشل: ${describeError(error)}`)
    return false
  }
}

async function main() {
  console.log(`📁 بدور على الصور في: ${IMAGES_FOLDER}`)
  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.log(`✗ الفولدر مش موجود خالص: ${IMAGES_FOLDER}`)
    return
  }
  console.log(`  محتويات الفولدر: ${fs.readdirSync(IMAGES_FOLDER).join(", ")}`)

  // ─── GREY ──────────────────────────────────────────────────────────────
  console.log("\n═══ GREY ═══")
  await uploadOne("grey_main_new.jpg", "tee-grey", "الـ Main الجديدة (Grey)")
  await uploadOne("grey_variant_new.jpg", "tee-grey-7", "Variant إضافية (Grey)")

  // ─── BEIGE ─────────────────────────────────────────────────────────────
  console.log("\n\n═══ BEIGE ═══")
  await uploadOne("beige_main_new.jpg", "tee-beige", "الـ Main الجديدة (Beige)")
  await uploadOne("beige_variant_new.jpg", "tee-beige-8", "Variant إضافية (Beige)")

  console.log("\n\n✅ خلص. لو كل حاجة طلعت ✓ نجح، قولي عشان أعدل الكود.")
}

main().catch((e) => console.log("✗ خطأ عام:", describeError(e)))
