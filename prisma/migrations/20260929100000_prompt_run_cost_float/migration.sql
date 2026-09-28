-- WaPromptRun table is still empty (no LLM calls have been logged yet),
-- so a plain type change is safe. Int cents would round every real call's
-- cost (a fraction of a cent) to 0 - see the schema comment.
ALTER TABLE "WaPromptRun" ALTER COLUMN "costEstimateCents" TYPE DOUBLE PRECISION;
