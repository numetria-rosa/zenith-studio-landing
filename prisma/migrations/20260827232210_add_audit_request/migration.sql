-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'PROPOSAL_SENT', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "AuditRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT,
    "formAnswers" JSONB NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditRequest_email_idx" ON "AuditRequest"("email");

-- CreateIndex
CREATE INDEX "AuditRequest_status_idx" ON "AuditRequest"("status");
