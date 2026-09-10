import { db } from "@/lib/db";

/* The one shared public demo project every prospect/visitor tests against
   (see [[demo-number-policy]] in memory: never provision a new number or
   project per demo, everyone reuses this one). Its Vapi Integration
   config carries the Cal.com event type both the phone demo and the
   web-call demo book real appointments into. */
export const DEMO_USER_EMAIL = "receptionist-demo@zenith-studio.site";

export async function getDemoCalEventTypeId(): Promise<number | null> {
  const integration = await db.integration.findFirst({
    where: { provider: "vapi", project: { user: { email: DEMO_USER_EMAIL } } },
    select: { config: true },
  });
  const config = integration?.config as { calEventTypeId?: number } | null;
  return config?.calEventTypeId ?? null;
}
