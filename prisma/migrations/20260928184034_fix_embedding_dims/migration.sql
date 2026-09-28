-- WaKbChunk.embedding was scaffolded at vector(1536) as an OpenAI-shaped
-- placeholder before Voyage was chosen. voyage-4-lite and voyage-multilingual-2
-- both return 1024-dim vectors (confirmed via a real API call). Table is
-- still empty (KB ingestion isn't built yet), so a plain type change is safe.
ALTER TABLE "WaKbChunk" ALTER COLUMN "embedding" TYPE vector(1024);
