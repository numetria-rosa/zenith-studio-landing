-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('GMAIL', 'YAHOO');

-- CreateEnum
CREATE TYPE "MailConnectionStatus" AS ENUM ('CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "InboxDraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MailConnection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" "MailProvider" NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "encryptedAppPassword" TEXT NOT NULL,
    "status" "MailConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxDraft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "draftReply" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "status" "InboxDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailConnection_projectId_idx" ON "MailConnection"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MailConnection_projectId_provider_emailAddress_key" ON "MailConnection"("projectId", "provider", "emailAddress");

-- CreateIndex
CREATE INDEX "InboxDraft_projectId_status_idx" ON "InboxDraft"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InboxDraft_projectId_sourceRef_key" ON "InboxDraft"("projectId", "sourceRef");

-- AddForeignKey
ALTER TABLE "MailConnection" ADD CONSTRAINT "MailConnection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxDraft" ADD CONSTRAINT "InboxDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
