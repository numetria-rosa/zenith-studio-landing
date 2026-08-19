import Whop from "@whop/sdk";

/* apiKey/webhookKey default to WHOP_API_KEY / WHOP_WEBHOOK_SECRET from env
   (see @whop/sdk client.d.ts) — passed explicitly here so it's obvious what
   this depends on. Both are empty strings until a real Whop product/webhook
   exist; the client can still be constructed, it just can't call the live
   API or verify a real signature until then. */
export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: process.env.WHOP_WEBHOOK_SECRET ? btoa(process.env.WHOP_WEBHOOK_SECRET) : null,
});
