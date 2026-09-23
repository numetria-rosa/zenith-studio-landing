-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "policyType" TEXT,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "lastReminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceCrmLogEntry" (
    "id" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "leadName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "forwardedToMake" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceCrmLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsurancePolicy_renewalDate_idx" ON "InsurancePolicy"("renewalDate");

-- CreateIndex
CREATE INDEX "InsuranceCrmLogEntry_createdAt_idx" ON "InsuranceCrmLogEntry"("createdAt");
