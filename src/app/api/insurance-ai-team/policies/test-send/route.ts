import { requireAdmin } from "@/lib/admin";
import { sendDueRenewalReminders } from "@/lib/insurance-renewals";

export async function POST() {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });
  const result = await sendDueRenewalReminders({ force: true });
  return Response.json(result);
}
