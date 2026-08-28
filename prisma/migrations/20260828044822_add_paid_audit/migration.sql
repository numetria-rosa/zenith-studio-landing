-- CreateEnum
CREATE TYPE "PaidAuditStatus" AS ENUM ('PAYMENT_PENDING', 'PAID', 'BOOKING_PENDING', 'BOOKED', 'COMPLETED', 'FOLLOW_UP', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PaidAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "status" "PaidAuditStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "amountCents" INTEGER NOT NULL DEFAULT 3500,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "whopPaymentId" TEXT,
    "whopMembershipId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "followUpNote" TEXT,
    "relatedAuditRequestId" TEXT,
    "relatedProposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaidAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaidAudit_whopPaymentId_key" ON "PaidAudit"("whopPaymentId");

-- CreateIndex
CREATE INDEX "PaidAudit_userId_idx" ON "PaidAudit"("userId");

-- CreateIndex
CREATE INDEX "PaidAudit_status_idx" ON "PaidAudit"("status");

-- CreateIndex
CREATE INDEX "PaidAudit_relatedAuditRequestId_idx" ON "PaidAudit"("relatedAuditRequestId");

-- CreateIndex
CREATE INDEX "PaidAudit_relatedProposalId_idx" ON "PaidAudit"("relatedProposalId");

-- AddForeignKey
ALTER TABLE "PaidAudit" ADD CONSTRAINT "PaidAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaidAudit" ADD CONSTRAINT "PaidAudit_relatedAuditRequestId_fkey" FOREIGN KEY ("relatedAuditRequestId") REFERENCES "AuditRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaidAudit" ADD CONSTRAINT "PaidAudit_relatedProposalId_fkey" FOREIGN KEY ("relatedProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
