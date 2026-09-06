-- CreateTable
CREATE TABLE "CheckoutAttempt" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutAttempt_courseId_idx" ON "CheckoutAttempt"("courseId");

-- CreateIndex
CREATE INDEX "CheckoutAttempt_createdAt_idx" ON "CheckoutAttempt"("createdAt");
