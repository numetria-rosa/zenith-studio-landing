-- Per-agency data retention setting, default 12 months (CLAUDE.md §7 GDPR).
ALTER TABLE "WaAgentSettings" ADD COLUMN "retentionMonths" INTEGER NOT NULL DEFAULT 12;
