import { listRecentBookings } from "@/lib/cal-booking";
import { getDemoCalEventTypeId } from "@/lib/demo-config";

/* Public, polled by the /demo page's live bookings feed. Only ever reads
   the shared demo calendar, never anything belonging to a real client. */
export async function GET(): Promise<Response> {
  const eventTypeId = await getDemoCalEventTypeId();
  if (!eventTypeId) return Response.json({ bookings: [] });

  const result = await listRecentBookings(eventTypeId, 5);
  if (!result.ok) return Response.json({ bookings: [] });
  return Response.json({ bookings: result.bookings });
}
