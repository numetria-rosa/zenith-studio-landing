-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('NEW', 'SCOPING', 'ONBOARDING', 'BUILDING', 'QA', 'LIVE', 'MAINTENANCE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('MISSING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ServiceProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogServiceId" TEXT,
    "proposalId" TEXT,
    "sourceServiceId" TEXT,
    "stage" "ProjectStage" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "adminNote" TEXT,
    "whopMonthlyMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRequirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'MISSING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceProject_userId_idx" ON "ServiceProject"("userId");

-- CreateIndex
CREATE INDEX "ServiceProject_proposalId_idx" ON "ServiceProject"("proposalId");

-- CreateIndex
CREATE INDEX "ServiceProject_sourceServiceId_idx" ON "ServiceProject"("sourceServiceId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "ClientRequirement_projectId_idx" ON "ClientRequirement"("projectId");

-- AddForeignKey
ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_catalogServiceId_fkey" FOREIGN KEY ("catalogServiceId") REFERENCES "ServiceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequirement" ADD CONSTRAINT "ClientRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
