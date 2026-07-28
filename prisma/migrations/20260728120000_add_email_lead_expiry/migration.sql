-- AlterTable
-- بنضيف codeExpiresAt بدون default الأول عشان الصفوف القديمة (لو فيه) محتاجة قيمة يدوية،
-- بعدين نحولها NOT NULL. لو الجدول فاضي (الغالب) هيعدي على طول.
ALTER TABLE "EmailLead" ADD COLUMN "codeExpiresAt" TIMESTAMP(3);

-- لو فيه صفوف قديمة من غير الحقل ده، نديها صلاحية 48 ساعة من تاريخ إنشائها
UPDATE "EmailLead" SET "codeExpiresAt" = "createdAt" + INTERVAL '48 hours' WHERE "codeExpiresAt" IS NULL;

-- دلوقتي نخليها NOT NULL
ALTER TABLE "EmailLead" ALTER COLUMN "codeExpiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "EmailLead_email_codeExpiresAt_idx" ON "EmailLead"("email", "codeExpiresAt");
