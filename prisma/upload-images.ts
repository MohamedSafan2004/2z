// @ts-ignore
const { v2: cloudinary } = require("cloudinary")
// @ts-ignore
const dotenv = require("dotenv")
// @ts-ignore
const path = require("path")

dotenv.config()

cloudinary.config(true)

const IMAGES_FOLDER = "D:\\2Z"

const images: Record<string, string> = {
  black: "black.jpeg",
  white: "white.jpeg",
  grey:  "rsasy.jpeg",
  beige: "bage.jpeg",
}

async function main() {
  const results: Record<string, string> = {}

  for (const [color, filename] of Object.entries(images)) {
    const filePath = path.join(IMAGES_FOLDER, filename)

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "2z-store",
        public_id: `tee-${color}`,
        overwrite: true,
        resource_type: "image",
      })

      results[color] = result.secure_url
      console.log(`✓ ${color} → ${result.secure_url}`)
    } catch (error: any) {
      console.log(`✗ فشل رفع ${filename}: ${error.message}`)
    }
  }

  console.log("\n=== الروابط النهائية ===")
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)