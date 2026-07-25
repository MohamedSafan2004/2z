-- CreateTable
CREATE TABLE "EmailLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "promoCode" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'popup_10off',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLead_email_key" ON "EmailLead"("email");

-- CreateIndex
CREATE INDEX "EmailLead_createdAt_idx" ON "EmailLead"("createdAt");
