-- When a subscription was cancelled; client data is purged 30 days later.
ALTER TABLE "ServiceProject" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "DocChaseItem" ADD COLUMN "fileDeletedAt" TIMESTAMP(3);
