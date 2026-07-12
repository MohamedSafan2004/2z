import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const fs = require("fs")
// @ts-ignore
const path = require("path")

cloudinary.config(true)

// ─── الإعدادات ────────────────────────────────────────────────────────
const BASE_FOLDER = "D:\\2Z\\colors"

// كل لون: اسم الفولدر على جهازك → اسم اللون في Cloudinary
// المفتاح = اسم الفولدر، القيمة = اسم اللون اللي هيتحط في الـ public_id
const COLOR_FOLDERS: Record<string, string> = {
  B: "black",
  W: "white",
  G: "grey",
  BA: "beige",
}

// أسماء ملفات الـ Main المحتملة (بترتيب الأولوية) — أول واحد يتلاقي هو اللي هيتاخد كـ Main
const MAIN_FILENAMES = ["Main.JPG", "Main (2).JPG", "Main.jpg", "main.jpg"]
// ────────────────────────────────────────────────────────────────────

interface UploadResult {
  color: string
  publicId: string
  url: string
}

async function uploadOne(filePath: string, publicId: string): Promise<UploadResult | null> {
  try {
    // نمسح النسخة القديمة الأول (لو موجودة) عشان الـ cache متتلخبطش
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })
    } catch {
      // مفيش نسخة قديمة، عادي
    }

    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId, // already includes "2z-store/" prefix — don't pass folder separately
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    })

    console.log(`  ✓ ${publicId} → ${result.secure_url}`)
    return { color: publicId, publicId, url: result.secure_url }
  } catch (error: any) {
    console.log(`  ✗ فشل رفع ${filePath}: ${error.message}`)
    return null
  }
}

// بتمسح النسخ الغلط اللي اترفعت المرة اللي فاتت بمسار مكرر (2z-store/2z-store/...)
async function cleanupWrongPaths() {
  console.log("🧹 بمسح النسخ الغلط اللي فيها مسار مكرر...")
  for (const colorName of Object.values(COLOR_FOLDERS)) {
    // مش عارفين بالظبط كام صورة كانت اترفعت غلط، فبنجرب لحد 8 لكل لون
    const idsToTry = [`tee-${colorName}`, ...Array.from({ length: 7 }, (_, i) => `tee-${colorName}-${i + 2}`)]
    for (const id of idsToTry) {
      const wrongPublicId = `2z-store/2z-store/${id}`
      try {
        const result = await cloudinary.uploader.destroy(wrongPublicId, { resource_type: "image", invalidate: true })
        if (result.result === "ok") console.log(`  🗑️  اتمسح: ${wrongPublicId}`)
      } catch {
        // مفيش حاجة بالاسم ده، عادي
      }
    }
  }
  console.log("")
}

async function main() {
  await cleanupWrongPaths()

  const manifest: Record<string, string[]> = {}

  for (const [folderName, colorName] of Object.entries(COLOR_FOLDERS)) {
    const colorPath = path.join(BASE_FOLDER, folderName)

    if (!fs.existsSync(colorPath)) {
      console.log(`⚠️  الفولدر مش موجود: ${colorPath} — اتخطى`)
      continue
    }

    console.log(`\n📁 ${folderName} (${colorName})`)

    const allFiles: string[] = fs.readdirSync(colorPath).filter((f: string) =>
      /\.(jpe?g|png|webp)$/i.test(f)
    )

    // نلاقي ملف الـ Main
    const mainFile = allFiles.find((f) => MAIN_FILENAMES.includes(f))
    if (!mainFile) {
      console.log(`  ⚠️  مفيش ملف Main في الفولدر ده — اتخطى اللون ده`)
      continue
    }

    // باقي الصور (كل حاجة غير الـ Main) — بأي ترتيب موجودين بيه في الفولدر
    const extraFiles = allFiles.filter((f) => f !== mainFile).sort()

    const urls: string[] = []

    // رفع الـ Main أولاً — public_id: tee-{color}
    const mainResult = await uploadOne(path.join(colorPath, mainFile), `2z-store/tee-${colorName}`)
    if (mainResult) urls.push(mainResult.url)

    // رفع باقي الصور — public_id: tee-{color}-2, tee-{color}-3, ...
    for (let i = 0; i < extraFiles.length; i++) {
      const publicId = `2z-store/tee-${colorName}-${i + 2}`
      const result = await uploadOne(path.join(colorPath, extraFiles[i]), publicId)
      if (result) urls.push(result.url)
    }

    manifest[colorName.toUpperCase()] = urls
  }

  console.log("\n\n✅ خلصنا الرفع. الروابط الجاهزة (انسخها في الكود):\n")
  console.log(JSON.stringify(manifest, null, 2))
}

main().catch(console.error)