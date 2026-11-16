import { timingSafeEqual } from "node:crypto";

/* Who may call /api/cron/*. Vercel sends `Authorization: Bearer <CRON_SECRET>` with every cron request, but only when
   the CRON_SECRET environment variable exists (vercel.com/docs/cron-jobs/manage-cron-jobs). No secret in production
   means nobody is authorized: the old `x-vercel-cron: 1` fallback is a header anyone can send. Outside production
   (local development) an unset secret allows the call so the routes can be tried by hand. */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const sent = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return sent.length === wanted.length && timingSafeEqual(sent, wanted);
}
