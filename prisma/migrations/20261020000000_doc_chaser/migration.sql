CREATE TABLE "DocChaseClient" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "uploadToken" TEXT NOT NULL,
    "chaseCount" INTEGER NOT NULL DEFAULT 0,
    "lastChasedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocChaseClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocChaseItem" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "rejectReason" TEXT,
    "filePathname" TEXT,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocChaseItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocChaseClient_uploadToken_key" ON "DocChaseClient"("uploadToken");
CREATE UNIQUE INDEX "DocChaseClient_projectId_email_key" ON "DocChaseClient"("projectId", "email");
CREATE INDEX "DocChaseClient_projectId_idx" ON "DocChaseClient"("projectId");
CREATE INDEX "DocChaseItem_clientId_idx" ON "DocChaseItem"("clientId");

ALTER TABLE "DocChaseClient" ADD CONSTRAINT "DocChaseClient_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocChaseItem" ADD CONSTRAINT "DocChaseItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DocChaseClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
