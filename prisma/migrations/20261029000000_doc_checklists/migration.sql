-- Document Chaser: the firm's own saved checklists, and a client's note on a document ("I don't have this").
CREATE TABLE "DocChecklist" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocChecklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocChecklist_projectId_name_key" ON "DocChecklist"("projectId", "name");

ALTER TABLE "DocChecklist" ADD CONSTRAINT "DocChecklist_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocChaseItem" ADD COLUMN "clientNote" TEXT;
