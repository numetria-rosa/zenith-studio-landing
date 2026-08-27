-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "currentImpact" TEXT NOT NULL,
    "recommendedSolution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecommendation" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "catalogServiceId" TEXT,
    "title" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "rationale" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "estimatedEffort" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditFinding_auditId_idx" ON "AuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "AuditRecommendation_auditId_idx" ON "AuditRecommendation"("auditId");

-- CreateIndex
CREATE INDEX "AuditRecommendation_catalogServiceId_idx" ON "AuditRecommendation"("catalogServiceId");

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecommendation" ADD CONSTRAINT "AuditRecommendation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecommendation" ADD CONSTRAINT "AuditRecommendation_catalogServiceId_fkey" FOREIGN KEY ("catalogServiceId") REFERENCES "ServiceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
