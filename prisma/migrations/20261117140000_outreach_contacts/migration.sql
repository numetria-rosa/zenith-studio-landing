-- AlterTable
ALTER TABLE "DemoHit" ADD COLUMN "contact" TEXT,
ADD COLUMN "visit" TEXT;

-- CreateTable
CREATE TABLE "OutreachContact" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "hasWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "emailedAt" TIMESTAMP(3),
    "resendId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "followUps" INTEGER NOT NULL DEFAULT 0,
    "repliedAt" TIMESTAMP(3),
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachContact_code_key" ON "OutreachContact"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachContact_email_key" ON "OutreachContact"("email");

-- CreateIndex
CREATE INDEX "OutreachContact_market_idx" ON "OutreachContact"("market");

-- CreateIndex
CREATE INDEX "DemoHit_contact_idx" ON "DemoHit"("contact");
