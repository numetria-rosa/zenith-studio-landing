-- Optional £5/1,000-extra-replies add-on pack (off by default per spec).
ALTER TABLE "WaAgentSettings" ADD COLUMN "overageEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WaUsageCounter" ADD COLUMN "overagePacks" INTEGER NOT NULL DEFAULT 0;
