-- AlterTable
ALTER TABLE "DemoHit" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'view',
ADD COLUMN "target" TEXT;
