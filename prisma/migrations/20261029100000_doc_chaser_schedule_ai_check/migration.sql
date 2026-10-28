-- Document Chaser: a later first email (chase by the tax calendar), and the AI check of each upload.
ALTER TABLE "DocChaseClient" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "DocChaseItem" ADD COLUMN "aiVerdict" TEXT;
ALTER TABLE "DocChaseItem" ADD COLUMN "aiNote" TEXT;
