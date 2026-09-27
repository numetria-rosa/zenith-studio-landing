-- CreateTable
CREATE TABLE "TextingRegistration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BRAND_PENDING',
    "brandId" TEXT,
    "campaignId" TEXT,
    "orderId" TEXT,
    "details" JSONB NOT NULL,
    "lastError" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TextingRegistration_projectId_key" ON "TextingRegistration"("projectId");

-- CreateIndex
CREATE INDEX "TextingRegistration_status_idx" ON "TextingRegistration"("status");

-- AddForeignKey
ALTER TABLE "TextingRegistration" ADD CONSTRAINT "TextingRegistration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
