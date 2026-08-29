-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('RESEARCHED', 'REJECTED', 'NEEDS_REVIEW', 'READY_TO_SEND', 'SEQUENCE_ACTIVE', 'REPLIED', 'HOT', 'AUDIT_REQUESTED', 'CUSTOMER', 'UNSUBSCRIBED', 'NOT_INTERESTED', 'BOUNCED', 'WRONG_CONTACT');

-- CreateEnum
CREATE TYPE "OutreachPriority" AS ENUM ('A', 'B', 'C', 'SKIP');

-- CreateEnum
CREATE TYPE "OutreachPath" AS ENUM ('PROPOSAL', 'FREE_AUDIT', 'PAID_AUDIT_CALL');

-- CreateEnum
CREATE TYPE "OutreachEmailType" AS ENUM ('INITIAL', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3');

-- CreateEnum
CREATE TYPE "OutreachMessageStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'READY_TO_SEND', 'QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReplyClass" AS ENUM ('INTERESTED', 'WANTS_INFO', 'WANTS_AUDIT', 'WANTS_PRICING', 'WANTS_CALL', 'NOT_INTERESTED', 'UNSUBSCRIBE', 'WRONG_CONTACT', 'OUT_OF_OFFICE', 'OTHER');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "area" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "prospectScore" INTEGER NOT NULL,
    "outreachScore" INTEGER NOT NULL,
    "priority" "OutreachPriority" NOT NULL,
    "tier" TEXT NOT NULL,
    "recommendedServiceId" TEXT NOT NULL,
    "recommendedOffer" TEXT NOT NULL,
    "outreachPath" "OutreachPath" NOT NULL,
    "personalizationSignal" TEXT NOT NULL,
    "opportunity" TEXT NOT NULL,
    "buyingSignal" TEXT,
    "researchData" JSONB NOT NULL,
    "status" "ProspectStatus" NOT NULL DEFAULT 'RESEARCHED',
    "rejectionReasons" JSONB,
    "unsubscribeToken" TEXT NOT NULL,
    "sequenceStep" INTEGER NOT NULL DEFAULT 0,
    "sequenceStoppedAt" TIMESTAMP(3),
    "sequenceStopReason" TEXT,
    "lastOutreachAt" TIMESTAMP(3),
    "proposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "emailType" "OutreachEmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "status" "OutreachMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "factsUsed" JSONB NOT NULL,
    "factCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "factCheckNotes" JSONB,
    "servicePagePath" TEXT NOT NULL,
    "proposalPath" TEXT,
    "auditCta" TEXT NOT NULL,
    "resendEmailId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "replyClass" "ReplyClass",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxEmailsPerHour" INTEGER NOT NULL DEFAULT 8,
    "maxEmailsPerDay" INTEGER NOT NULL DEFAULT 30,
    "followUp1Hours" INTEGER NOT NULL DEFAULT 72,
    "followUp2Hours" INTEGER NOT NULL DEFAULT 168,
    "followUp3Hours" INTEGER NOT NULL DEFAULT 336,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_unsubscribeToken_key" ON "Prospect"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_proposalId_key" ON "Prospect"("proposalId");

-- CreateIndex
CREATE INDEX "Prospect_email_idx" ON "Prospect"("email");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_priority_idx" ON "Prospect"("priority");

-- CreateIndex
CREATE INDEX "Prospect_niche_city_idx" ON "Prospect"("niche", "city");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachMessage_resendEmailId_key" ON "OutreachMessage"("resendEmailId");

-- CreateIndex
CREATE INDEX "OutreachMessage_prospectId_idx" ON "OutreachMessage"("prospectId");

-- CreateIndex
CREATE INDEX "OutreachMessage_status_idx" ON "OutreachMessage"("status");

-- CreateIndex
CREATE INDEX "OutreachMessage_scheduledFor_idx" ON "OutreachMessage"("scheduledFor");

-- CreateIndex
CREATE INDEX "OutreachEvent_prospectId_createdAt_idx" ON "OutreachEvent"("prospectId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_type_idx" ON "OutreachEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppression_email_key" ON "EmailSuppression"("email");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
