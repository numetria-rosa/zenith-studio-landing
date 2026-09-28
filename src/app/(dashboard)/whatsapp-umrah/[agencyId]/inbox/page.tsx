import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedAgency, listConversations, getConversationThread } from "@/lib/whatsapp-umrah/dashboard-data";
import { takeOverConversationAction, resumeAiAction, sendHumanReplyAction } from "../actions";
import waStyles from "../waConsole.module.css";

export default async function InboxPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ c?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const { c: selectedId } = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const conversations = await listConversations(agencyId);
  const activeId = selectedId || conversations[0]?.id;
  const thread = activeId ? await getConversationThread(agencyId, activeId) : null;

  const takeOver = activeId ? takeOverConversationAction.bind(null, agencyId, activeId) : null;
  const resume = activeId ? resumeAiAction.bind(null, agencyId, activeId) : null;
  const sendReply = activeId ? sendHumanReplyAction.bind(null, agencyId, activeId) : null;

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Inbox</h1>
      <p className={waStyles.pageDesc}>Every conversation, live. Take over any chat, or let the AI keep going.</p>

      <div className={waStyles.twoCol}>
        <div className={waStyles.convList}>
          {conversations.length === 0 && <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>No conversations yet.</p>}
          {conversations.map((c) => (
            <Link key={c.id} href={`/whatsapp-umrah/${agencyId}/inbox?c=${c.id}`} className={`${waStyles.convItem} ${c.id === activeId ? waStyles.convItemActive : ""}`}>
              <div className={waStyles.convName}>{c.contact.name || c.contact.phone}</div>
              <div className={waStyles.convMeta}>
                <span className={`${waStyles.badge} ${c.status === "HUMAN" ? waStyles.badgeHuman : waStyles.badgeAi}`}>{c.status === "HUMAN" ? "Human" : "AI"}</span>{" "}
                {c._count.messages} message{c._count.messages === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>

        {thread ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{thread.contact.name || thread.contact.phone}</div>
                <span className={`${waStyles.badge} ${thread.status === "HUMAN" ? waStyles.badgeHuman : waStyles.badgeAi}`}>{thread.status === "HUMAN" ? "Human is handling this" : "AI is replying"}</span>
              </div>
              <form action={thread.status === "HUMAN" ? resume! : takeOver!}>
                <button type="submit" className={waStyles.badgeAi} style={{ padding: "8px 16px", border: "1px solid var(--zc-done)" }}>
                  {thread.status === "HUMAN" ? "Resume AI" : "Take over"}
                </button>
              </form>
            </div>

            <div className={waStyles.chatWrap} style={{ height: "55vh" }}>
              <div className={waStyles.chatMessages}>
                {thread.messages.map((m) => (
                  <div key={m.id} className={`${waStyles.bubble} ${m.direction === "IN" ? waStyles.bubbleUser : waStyles.bubbleAi}`}>
                    {m.body}
                    <div className={waStyles.bubbleMeta}>
                      {m.sender === "CUSTOMER" ? "Customer" : m.sender === "HUMAN" ? "You" : "AI"} · {m.createdAt.toISOString().slice(11, 16)}
                    </div>
                  </div>
                ))}
              </div>
              {thread.status === "HUMAN" && (
                <form action={sendReply!} className={waStyles.chatComposer}>
                  <input name="body" className={waStyles.input} placeholder="Type your reply…" required />
                  <button type="submit" className={waStyles.badgeAi} style={{ padding: "0 18px", border: "1px solid var(--zc-done)", flexShrink: 0 }}>
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>Select a conversation.</p>
        )}
      </div>
    </div>
  );
}
