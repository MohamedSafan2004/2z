import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const path = require("path")

cloudinary.config(true)

const IMAGES_FOLDER = "D:\\2Z"

const images: Record<string, string> = {
  "tee-grey": "gray.jpeg",
}

async function main() {
  const results: Record<string, string> = {}

  for (const [key, filename] of Object.entries(images)) {
    const filePath = path.join(IMAGES_FOLDER, filename)

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "2z-store",
        public_id: key,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      })

      results[key] = result.secure_url
      console.log(`✓ ${key} → ${result.secure_url}`)
      console.log(`  version: ${result.version}`)
    } catch (error: any) {
      console.log(`✗ فشل رفع ${filename}: ${error.message}`)
    }
  }

  console.log("\n=== الروابط النهائية ===")
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)