-- Structured knowledge base entries: packages and FAQs keep their form values so they can be edited again.
ALTER TYPE "WaKbDocumentKind" ADD VALUE IF NOT EXISTS 'FAQ';
ALTER TABLE "WaKbDocument" ADD COLUMN "fields" JSONB;
