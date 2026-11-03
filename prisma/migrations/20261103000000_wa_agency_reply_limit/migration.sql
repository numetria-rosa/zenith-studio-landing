-- WhatsApp Umrah: agencies set their own monthly reply limit; the paid extra-replies pack is gone.
ALTER TABLE "WaAgentSettings" ADD COLUMN "monthlyReplyLimit" INTEGER;
ALTER TABLE "WaAgentSettings" DROP COLUMN "overageEnabled";
ALTER TABLE "WaUsageCounter" DROP COLUMN "overagePacks";
