import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const path = require("path")

cloudinary.config(true)

const IMAGES_FOLDER = "D:\\2Z"

const images: Record<string, string> = {
  "tee-black":  "black.jpeg",
  "tee-black-2": "black 2.jpeg",
  "tee-white":  "white.jpeg",
  "tee-white-2": "white 2.jpeg",
  "tee-grey":   "gray.jpeg",
  "tee-grey-2":  "gray 2.jpeg",
  "tee-beige":  "bage.jpeg",
  "tee-beige-2": "bage 2.jpeg",
  "hero":       "hero.png",
  "size-chart": "Black and Gray Modern T-Shirt Size Chart Instagram Post.jpg",
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
        resource_type: "image",
      })

      results[key] = result.secure_url
      console.log(`✓ ${key} → ${result.secure_url}`)
    } catch (error: any) {
      console.log(`✗ فشل رفع ${filename}: ${error.message}`)
    }
  }

  console.log("\n=== الروابط النهائية ===")
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)