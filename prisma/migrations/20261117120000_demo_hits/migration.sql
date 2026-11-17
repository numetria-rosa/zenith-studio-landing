-- CreateTable
CREATE TABLE "DemoHit" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "country" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoHit_createdAt_idx" ON "DemoHit"("createdAt");
