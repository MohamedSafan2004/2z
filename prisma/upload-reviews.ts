import * as dotenv from "dotenv"
dotenv.config()

import { v2 as cloudinary } from "cloudinary"
import * as path from "path"

cloudinary.config(true)

const IMAGES_FOLDER = "D:\\2Z"

// filename على جهازك -> public_id على Cloudinary
const FILES: { filename: string; publicId: string }[] = [
  { filename: "WhatsApp Image 2026-07-31 at 2.26.00 PM (1).jpeg", publicId: "review-1" },
  { filename: "WhatsApp Image 2026-07-31 at 2.26.00 PM (2).jpeg", publicId: "review-2" },
  { filename: "WhatsApp Image 2026-07-31 at 2.26.00 PM (3).jpeg", publicId: "review-3" },
  { filename: "WhatsApp Image 2026-07-31 at 2.26.00 PM (4).jpeg", publicId: "review-4" },
  { filename: "WhatsApp Image 2026-07-31 at 2.26.00 PM.jpeg", publicId: "review-5" },
  { filename: "WhatsApp Image 2026-07-31 at 2.26.01 PM.jpeg", publicId: "review-6" },
  { filename: "WhatsApp Image 2026-07-31 at 2.35.52 PM.jpeg", publicId: "review-7" },
]

async function main() {
  for (const { filename, publicId } of FILES) {
    const fullPublicId = `2z-store/reviews/${publicId}`
    const filePath = path.join(IMAGES_FOLDER, filename)

    console.log(`\n📤 برفع ${filename} → ${fullPublicId}...`)

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "2z-store/reviews",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      })

      console.log(`✓ نجح → ${result.secure_url}`)
      console.log(`  width: ${result.width}, height: ${result.height}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`✗ فشل رفع ${filename}: ${message}`)
    }
  }

  console.log("\n✅ خلصنا كل الصور.")
}

main().catch(console.error)
