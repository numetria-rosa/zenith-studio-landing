-- WhatsApp Umrah: remember when the team was last emailed about a chat waiting on a person.
ALTER TABLE "WaConversation" ADD COLUMN "humanAlertedAt" TIMESTAMP(3);
