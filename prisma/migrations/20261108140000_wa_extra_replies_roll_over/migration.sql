-- Extra reply packs no longer lapse at month end: track how many replies each pack has left.
ALTER TABLE "WaExtraReplies" ADD COLUMN "remaining" INTEGER NOT NULL DEFAULT 0;
UPDATE "WaExtraReplies" SET "remaining" = "replies";
