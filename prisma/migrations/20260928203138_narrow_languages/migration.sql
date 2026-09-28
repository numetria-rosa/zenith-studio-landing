-- AlterTable
ALTER TABLE "WaAgentSettings" ALTER COLUMN "languagesEnabled" SET DEFAULT ARRAY['en', 'ar', 'tr', 'ur']::TEXT[];
