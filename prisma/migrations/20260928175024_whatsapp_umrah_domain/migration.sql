-- Enable pgvector for WaKbChunk.embedding (not previously used in this DB)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "WaAgencyStatus" AS ENUM ('ONBOARDING', 'LIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "WaMembershipRole" AS ENUM ('OWNER', 'AGENT');

-- CreateEnum
CREATE TYPE "WaProvider" AS ENUM ('META', 'MOCK');

-- CreateEnum
CREATE TYPE "WaAccountStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "WaKbDocumentKind" AS ENUM ('PACKAGE', 'TEXT', 'PDF', 'DOCX', 'CSV');

-- CreateEnum
CREATE TYPE "WaTone" AS ENUM ('WARM', 'FORMAL');

-- CreateEnum
CREATE TYPE "WaAwayMode" AS ENUM ('AI_REPLIES', 'AWAY_MESSAGE_ONLY');

-- CreateEnum
CREATE TYPE "WaConversationStatus" AS ENUM ('AI', 'HUMAN', 'CLOSED');

-- CreateEnum
CREATE TYPE "WaEntryPoint" AS ENUM ('ORGANIC', 'CTWA_AD', 'FB_CTA');

-- CreateEnum
CREATE TYPE "WaMessageDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "WaMessageSender" AS ENUM ('CUSTOMER', 'AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "WaMessageType" AS ENUM ('TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "WaLeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'HOT', 'HANDED_OFF', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "WaHandoffTrigger" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "WaPlan" AS ENUM ('STARTER', 'GROWTH', 'PRO');

-- CreateEnum
CREATE TYPE "WaSubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaPromptStage" AS ENUM ('DRAFT', 'ESCALATION', 'GUARD');

-- CreateTable
CREATE TABLE "WaAgency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GB',
    "status" "WaAgencyStatus" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaMembership" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WaMembershipRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaWhatsAppAccount" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "provider" "WaProvider" NOT NULL DEFAULT 'META',
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "displayPhoneNumber" TEXT,
    "encryptedAccessToken" TEXT,
    "status" "WaAccountStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaWhatsAppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaKbDocument" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "kind" "WaKbDocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "sourceFilename" TEXT,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaKbDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaKbChunk" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaKbChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaAgentSettings" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'Assistant',
    "tone" "WaTone" NOT NULL DEFAULT 'WARM',
    "emojiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "signOff" TEXT,
    "languagesEnabled" TEXT[] DEFAULT ARRAY['en', 'ur', 'ur-Latn', 'bn', 'ar']::TEXT[],
    "businessHours" JSONB,
    "awayMode" "WaAwayMode" NOT NULL DEFAULT 'AI_REPLIES',
    "awayMessage" TEXT,
    "hotLeadRule" JSONB,
    "autoResumeIdleMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAgentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaContact" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "language" TEXT,
    "optOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaConversation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "WaConversationStatus" NOT NULL DEFAULT 'AI',
    "entryPoint" "WaEntryPoint" NOT NULL DEFAULT 'ORGANIC',
    "lastCustomerMessageAt" TIMESTAMP(3),
    "aiPausedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "direction" "WaMessageDirection" NOT NULL,
    "sender" "WaMessageSender" NOT NULL,
    "type" "WaMessageType" NOT NULL DEFAULT 'TEXT',
    "waMessageId" TEXT,
    "templateName" TEXT,
    "body" TEXT,
    "metaBillable" BOOLEAN NOT NULL DEFAULT false,
    "costEstimateCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaLead" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "WaLeadStatus" NOT NULL DEFAULT 'NEW',
    "travelDates" TEXT,
    "travelers" INTEGER,
    "budgetGbp" INTEGER,
    "departureCity" TEXT,
    "hotelTier" TEXT,
    "packagePreference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaLeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaLeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaHandoff" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" "WaHandoffTrigger" NOT NULL,
    "takenByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WaHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaSubscription" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "whopMembershipId" TEXT,
    "whopPlanId" TEXT,
    "plan" "WaPlan" NOT NULL DEFAULT 'STARTER',
    "status" "WaSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "foundingOffer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaUsageCounter" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "aiReplies" INTEGER NOT NULL DEFAULT 0,
    "templateMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WaUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaAuditLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaPromptRun" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "stage" "WaPromptStage" NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "costEstimateCents" INTEGER,
    "guardsTriggered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaPromptRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaWaitlistSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" "WaPlan" NOT NULL,
    "agencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaWaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaAgency_slug_key" ON "WaAgency"("slug");

-- CreateIndex
CREATE INDEX "WaAgency_status_idx" ON "WaAgency"("status");

-- CreateIndex
CREATE INDEX "WaMembership_userId_idx" ON "WaMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WaMembership_agencyId_userId_key" ON "WaMembership"("agencyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WaWhatsAppAccount_agencyId_key" ON "WaWhatsAppAccount"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "WaWhatsAppAccount_phoneNumberId_key" ON "WaWhatsAppAccount"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WaKbDocument_agencyId_idx" ON "WaKbDocument"("agencyId");

-- CreateIndex
CREATE INDEX "WaKbChunk_agencyId_idx" ON "WaKbChunk"("agencyId");

-- CreateIndex
CREATE INDEX "WaKbChunk_documentId_idx" ON "WaKbChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "WaAgentSettings_agencyId_key" ON "WaAgentSettings"("agencyId");

-- CreateIndex
CREATE INDEX "WaContact_agencyId_idx" ON "WaContact"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "WaContact_agencyId_phone_key" ON "WaContact"("agencyId", "phone");

-- CreateIndex
CREATE INDEX "WaConversation_agencyId_idx" ON "WaConversation"("agencyId");

-- CreateIndex
CREATE INDEX "WaConversation_contactId_idx" ON "WaConversation"("contactId");

-- CreateIndex
CREATE INDEX "WaConversation_status_idx" ON "WaConversation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WaMessage_waMessageId_key" ON "WaMessage"("waMessageId");

-- CreateIndex
CREATE INDEX "WaMessage_agencyId_idx" ON "WaMessage"("agencyId");

-- CreateIndex
CREATE INDEX "WaMessage_conversationId_idx" ON "WaMessage"("conversationId");

-- CreateIndex
CREATE INDEX "WaLead_agencyId_idx" ON "WaLead"("agencyId");

-- CreateIndex
CREATE INDEX "WaLead_status_idx" ON "WaLead"("status");

-- CreateIndex
CREATE INDEX "WaLeadEvent_leadId_idx" ON "WaLeadEvent"("leadId");

-- CreateIndex
CREATE INDEX "WaHandoff_agencyId_idx" ON "WaHandoff"("agencyId");

-- CreateIndex
CREATE INDEX "WaHandoff_conversationId_idx" ON "WaHandoff"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "WaSubscription_agencyId_key" ON "WaSubscription"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "WaSubscription_whopMembershipId_key" ON "WaSubscription"("whopMembershipId");

-- CreateIndex
CREATE INDEX "WaUsageCounter_agencyId_idx" ON "WaUsageCounter"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "WaUsageCounter_agencyId_periodStart_key" ON "WaUsageCounter"("agencyId", "periodStart");

-- CreateIndex
CREATE INDEX "WaAuditLog_agencyId_idx" ON "WaAuditLog"("agencyId");

-- CreateIndex
CREATE INDEX "WaPromptRun_agencyId_idx" ON "WaPromptRun"("agencyId");

-- CreateIndex
CREATE INDEX "WaPromptRun_conversationId_idx" ON "WaPromptRun"("conversationId");

-- CreateIndex
CREATE INDEX "WaWaitlistSignup_plan_idx" ON "WaWaitlistSignup"("plan");

-- AddForeignKey
ALTER TABLE "WaMembership" ADD CONSTRAINT "WaMembership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMembership" ADD CONSTRAINT "WaMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaWhatsAppAccount" ADD CONSTRAINT "WaWhatsAppAccount_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaKbDocument" ADD CONSTRAINT "WaKbDocument_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaKbChunk" ADD CONSTRAINT "WaKbChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "WaKbDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaAgentSettings" ADD CONSTRAINT "WaAgentSettings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaContact" ADD CONSTRAINT "WaContact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "WaContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaLead" ADD CONSTRAINT "WaLead_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaLead" ADD CONSTRAINT "WaLead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaLead" ADD CONSTRAINT "WaLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "WaContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaLeadEvent" ADD CONSTRAINT "WaLeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WaLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaHandoff" ADD CONSTRAINT "WaHandoff_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaHandoff" ADD CONSTRAINT "WaHandoff_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaSubscription" ADD CONSTRAINT "WaSubscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaUsageCounter" ADD CONSTRAINT "WaUsageCounter_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaAuditLog" ADD CONSTRAINT "WaAuditLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaPromptRun" ADD CONSTRAINT "WaPromptRun_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
