-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'CHANGES_REQUESTED', 'APPROVED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProposalItemKind" AS ENUM ('SETUP', 'MONTHLY', 'PER_UNIT', 'CUSTOM', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "ClientApprovalAction" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "auditId" TEXT,
    "userId" TEXT,
    "clientEmail" TEXT NOT NULL,
    "clientName" TEXT,
    "companyName" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "accessToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "executiveSummary" TEXT,
    "currentChallenges" TEXT,
    "recommendedSolution" TEXT,
    "scopeOfWork" TEXT,
    "deliverables" TEXT,
    "implementationPlan" TEXT,
    "timeline" TEXT,
    "assumptions" TEXT,
    "notIncluded" TEXT,
    "nextSteps" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "ProposalItemKind" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "unitLabel" TEXT,
    "isOptionalAddOn" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogServiceId" TEXT,

    CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientApproval" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "action" "ClientApprovalAction" NOT NULL,
    "note" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "ClientApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_accessToken_key" ON "Proposal"("accessToken");

-- CreateIndex
CREATE INDEX "Proposal_auditId_idx" ON "Proposal"("auditId");

-- CreateIndex
CREATE INDEX "Proposal_userId_idx" ON "Proposal"("userId");

-- CreateIndex
CREATE INDEX "ProposalItem_proposalId_idx" ON "ProposalItem"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");

-- CreateIndex
CREATE INDEX "ClientApproval_proposalId_idx" ON "ClientApproval"("proposalId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_catalogServiceId_fkey" FOREIGN KEY ("catalogServiceId") REFERENCES "ServiceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientApproval" ADD CONSTRAINT "ClientApproval_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
