import * as dotenv from "dotenv"
dotenv.config()

import { v2 as cloudinary } from "cloudinary"

cloudinary.config(true)

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const anyErr = error as Record<string, unknown>
    if (typeof anyErr.message === "string") return anyErr.message
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

async function main() {
  console.log("↩️  برجّع tee-grey.jpg للصورة القديمة (من tee-grey-6)...")
  const oldGrey = await cloudinary.api.resource("2z-store/tee-grey-6")
  await cloudinary.uploader.upload(oldGrey.secure_url, {
    folder: "2z-store",
    public_id: "tee-grey",
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  })
  console.log("✓ tee-grey.jpg رجعت زي ما كانت")

  console.log("\n↩️  برجّع tee-beige.jpg للصورة القديمة (من tee-beige-7)...")
  const oldBeige = await cloudinary.api.resource("2z-store/tee-beige-7")
  await cloudinary.uploader.upload(oldBeige.secure_url, {
    folder: "2z-store",
    public_id: "tee-beige",
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  })
  console.log("✓ tee-beige.jpg رجعت زي ما كانت")

  console.log("\n🗑️  بمسح الصور الإضافية اللي مبقتش محتاجينها (tee-grey-6, tee-grey-7, tee-beige-7, tee-beige-8)...")
  const idsToDelete = ["2z-store/tee-grey-6", "2z-store/tee-grey-7", "2z-store/tee-beige-7", "2z-store/tee-beige-8"]
  for (const id of idsToDelete) {
    try {
      const result = await cloudinary.uploader.destroy(id, { resource_type: "image", invalidate: true })
      console.log(`  ${id} → ${result.result}`)
    } catch (error) {
      console.log(`  ${id} → فشل المسح: ${describeError(error)}`)
    }
  }

  console.log("\n✅ خلص. كل حاجة رجعت زي ما كانت بالظبط.")
}

main().catch((e) => console.log("✗ خطأ عام:", describeError(e)))
