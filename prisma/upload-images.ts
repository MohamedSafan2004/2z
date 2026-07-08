import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const path = require("path")

cloudinary.config(true)

const IMAGES_FOLDER = "D:\\2Z"
const PUBLIC_ID = "2z-store/tee-grey"
const FILENAME = "gray.jpeg"

async function main() {
  try {
    console.log("🗑️  بمسح النسخة القديمة...")
    const destroyResult = await cloudinary.uploader.destroy(PUBLIC_ID, { resource_type: "image", invalidate: true })
    console.log("   نتيجة المسح:", destroyResult.result)
  } catch (error: any) {
    console.log("   تحذير أثناء المسح (ممكن يكون عادي لو الملف مش موجود):", error.message)
  }

  console.log("\n⏳ بستنى 3 ثواني...")
  await new Promise((r) => setTimeout(r, 3000))

  console.log("\n📤 برفع الصورة الجديدة...")
  const filePath = path.join(IMAGES_FOLDER, FILENAME)

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "2z-store",
      public_id: "tee-grey",
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    })

    console.log(`✓ نجح الرفع → ${result.secure_url}`)
    console.log(`  version: ${result.version}`)
    console.log(`  bytes: ${result.bytes}`)
    console.log(`  created_at: ${result.created_at}`)
  } catch (error: any) {
    console.log(`✗ فشل الرفع: ${error.message}`)
  }
}

main().catch(console.error)