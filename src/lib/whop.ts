import Whop from "@whop/sdk";

/* Lazy singleton, not a module-level instantiation. @whop/sdk's constructor
   throws if apiKey is missing/empty, and WHOP_API_KEY is unset until a real
   Whop product exists — a module-level `new Whop(...)` would run during
   Next.js's build-time page-data collection (it did: it broke the Vercel
   build on this route) even though no request had come in yet. Constructing
   it lazily, only when a webhook actually arrives, defers that failure to
   request time, where it belongs. */
let _whop: Whop | null = null;

export function getWhopClient(): Whop {
  if (!_whop) {
    _whop = new Whop({
      apiKey: process.env.WHOP_API_KEY,
      webhookKey: process.env.WHOP_WEBHOOK_SECRET ? btoa(process.env.WHOP_WEBHOOK_SECRET) : null,
    });
  }
  return _whop;
}
