import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { listSupportRequestsForHq, getSupportRequestThread } from "@/lib/hq/queries";
import { changeSupportRequestStatus, replyToRequest } from "@/lib/hq/actions";
import { HqTopbar } from "../HqTopbar";
import { ServiceTag } from "../ServiceTag";
import { Toast } from "../Toast";
import type { ServiceKey } from "@/lib/hq";

const STATUS_LABEL: Record<string, string> = { OPEN: "open", IN_PROGRESS: "in progress", WAITING_CLIENT: "waiting on client", RESOLVED: "done", CLOSED: "closed" };
const STATUS_PILL: Record<string, string> = { OPEN: "p-wait", IN_PROGRESS: "p-run", WAITING_CLIENT: "p-wait", RESOLVED: "p-ok", CLOSED: "p-ok" };

export default async function HqRequestsPage({ searchParams }: { searchParams: Promise<{ filter?: string; id?: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { filter, id } = await searchParams;
  const rqF = filter === "done" || filter === "all" ? filter : "open";

  const all = await listSupportRequestsForHq();
  const list = all.filter((r) => (rqF === "all" ? true : rqF === "open" ? r.status !== "RESOLVED" && r.status !== "CLOSED" : r.status === "RESOLVED" || r.status === "CLOSED"));
  const current = (id ? all.find((r) => r.id === id) : null) ?? list[0] ?? null;
  const { thread } = current ? await getSupportRequestThread(current.id) : { thread: [] };

  async function replyAction(formData: FormData): Promise<void> {
    "use server";
    const session = await requireAdmin();
    if (!session?.user?.id) return;
    const requestId = String(formData.get("requestId"));
    await replyToRequest(requestId, session.user.id, String(formData.get("body") || ""));
    revalidatePath("/admin/requests");
    redirect(`/admin/requests?id=${requestId}&flash=${encodeURIComponent("Reply sent to the client dashboard")}`);
  }

  async function statusAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const requestId = String(formData.get("requestId"));
    await changeSupportRequestStatus(requestId, String(formData.get("status")) as "OPEN" | "IN_PROGRESS" | "WAITING_CLIENT" | "RESOLVED" | "CLOSED");
    revalidatePath("/admin/requests");
    redirect(`/admin/requests?id=${requestId}`);
  }

  return (
    <>
      <HqTopbar title="Requests" subtitle="Support tickets and messages from client dashboards." />
      <div className="bar2">
        <div className="seg" role="group" aria-label="Filter requests">
          <Link href="/admin/requests?filter=open" aria-pressed={rqF === "open"}>
            Open
          </Link>
          <Link href="/admin/requests?filter=done" aria-pressed={rqF === "done"}>
            Done
          </Link>
          <Link href="/admin/requests?filter=all" aria-pressed={rqF === "all"}>
            All
          </Link>
        </div>
      </div>

      <div className="rq">
        <div>
          {list.length === 0 && (
            <div className="empty">
              <b>No requests</b>You are all caught up.
            </div>
          )}
          {list.map((r) => (
            <Link key={r.id} href={`/admin/requests?filter=${rqF}&id=${r.id}`} className="rqi" aria-current={current?.id === r.id}>
              <div className="t">
                <b>{r.subject}</b>
                <span className={`pill ${STATUS_PILL[r.status]}`} style={{ fontSize: 12 }}>
                  <i />
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p>
                {r.project?.title ?? r.user.name ?? r.user.email} · {r.createdAt.toISOString().slice(0, 10)}
              </p>
            </Link>
          ))}
        </div>

        {current ? (
          <section className="card pad">
            <div className="ctop">
              <div>
                <h2>{current.subject}</h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {current.project?.title ?? current.user.name ?? current.user.email}
                  {current.project?.sourceServiceId && <ServiceTag service={current.project.sourceServiceId as ServiceKey} />}
                </p>
              </div>
              <form action={statusAction} className="seg sm" role="group" aria-label="Request status">
                <input type="hidden" name="requestId" value={current.id} />
                {(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
                  <button key={st} type="submit" name="status" value={st} aria-pressed={current.status === st}>
                    {st === "OPEN" ? "Open" : st === "IN_PROGRESS" ? "In progress" : "Done"}
                  </button>
                ))}
              </form>
            </div>

            <p className="muted" style={{ marginTop: 8 }}>{current.body}</p>

            <div className="thread">
              {thread.map((m) => (
                <div className={`m2${m.senderRole === "ADMIN" ? " me" : ""}`} key={m.id}>
                  {m.body}
                  <small>
                    {m.senderRole === "ADMIN" ? "You" : m.sender.name || m.sender.email} · {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </small>
                </div>
              ))}
            </div>

            <form action={replyAction} className="inp">
              <input type="hidden" name="requestId" value={current.id} />
              <input name="body" type="text" placeholder={`Reply to ${current.user.name || current.user.email}…`} aria-label="Reply" autoComplete="off" required />
              <button className="btn go" type="submit">
                Send
              </button>
            </form>
          </section>
        ) : (
          <div className="empty">
            <b>No requests</b>You are all caught up.
          </div>
        )}
      </div>
      <Toast />
    </>
  );
}
