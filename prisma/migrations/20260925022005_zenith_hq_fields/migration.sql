-- AlterTable
ALTER TABLE "ServiceCatalog" ADD COLUMN     "acceptingNewClients" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "freeSetup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingPageUrl" TEXT,
ADD COLUMN     "listPriceCents" INTEGER,
ADD COLUMN     "quarterlyCheckoutUrl" TEXT,
ADD COLUMN     "quarterlyPriceCentsPerMonth" INTEGER,
ADD COLUMN     "slaHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "trialEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whopQuarterlyPlanId" TEXT;

-- AlterTable
ALTER TABLE "ServiceProject" ADD COLUMN     "setupReadyBy" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'monthly';

-- CreateTable
CREATE TABLE "MrrSnapshot" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "serviceSlug" TEXT NOT NULL,
    "mrrCents" INTEGER NOT NULL,

    CONSTRAINT "MrrSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MrrSnapshot_month_serviceSlug_key" ON "MrrSnapshot"("month", "serviceSlug");
