-- WhatsApp Umrah: the owner can flag an AI reply as wrong.
ALTER TABLE "WaMessage" ADD COLUMN "flaggedAt" TIMESTAMP(3);
