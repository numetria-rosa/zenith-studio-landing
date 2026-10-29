import Link from "next/link";
import { checklistName, clientStage, FILE_RETENTION_DAYS, startsLater, MAX_CHASES, MAX_ITEMS, REJECT_REASONS, STAGE_LABELS, type ClientStage } from "@/lib/document-chaser";
import { uploadUrlFor } from "@/lib/document-chaser-db";
import { CopyField } from "./ConnectForm";
import { ChangeChecklist } from "./ChangeChecklist";
import type { PickerOption } from "./ChecklistPicker";
import { Icon } from "../../Icon";
import c from "./chaser.module.css";

type Item = { id: string; label: string; status: string; rejectReason: string | null; clientNote: string | null; filePathname: string | null; fileDeletedAt: Date | null; aiVerdict: string | null; aiNote: string | null };
type Client = { id: string; name: string; email: string; checklist: string; status: string; chaseCount: number; uploadToken: string; startAt: Date | null; items: Item[] };
type Option = PickerOption;

const ORDER: ClientStage[] = ["review", "waiting", "started", "complete", "paused"];

/* The accountant's client list, organized: filter by where each client is and by checklist, uploads waiting for
   review first. Every button posts to one server action with an `op`. */
export function DocChaserClients({
  clients,
  base,
  show,
  list,
  options,
  act,
  review,
}: {
  clients: Client[];
  base: string;
  show?: string;
  list?: string;
  options: Option[];
  act: (op: string, fd: FormData) => Promise<void>;
  review: (decision: string, fd: FormData) => Promise<void>;
}) {
  if (clients.length === 0) return null;
  const staged = clients.map((cl) => ({ cl, stage: clientStage(cl), list: checklistName(cl.checklist) }));
  const lists = [...new Set(staged.map((s) => s.list))].sort();
  const shown = staged
    .filter((s) => (!show || s.stage === show) && (!list || s.list === list))
    .sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage));
  const href = (q: { show?: string; list?: string }) => {
    const p = new URLSearchParams();
    if (q.show) p.set("show", q.show);
    if (q.list) p.set("list", q.list);
    const s = p.toString();
    return `${base}${s ? `?${s}` : ""}#clients`;
  };

  return (
    <section id="clients" className={c.clients}>
      <div className={c.clientsHead}>
        <h2 className={c.cardTitle}>Your clients</h2>
        <span className={c.count}>{clients.length} total</span>
      </div>

      <nav className={c.filters} aria-label="Filter by status">
        <Link href={href({ list })} className={!show ? c.filterOn : c.filter}>
          All <b>{staged.filter((s) => !list || s.list === list).length}</b>
        </Link>
        {ORDER.map((st) => {
          const n = staged.filter((s) => s.stage === st && (!list || s.list === list)).length;
          return n ? (
            <Link key={st} href={href({ show: st, list })} className={show === st ? c.filterOn : c.filter}>
              {STAGE_LABELS[st]} <b>{n}</b>
            </Link>
          ) : null;
        })}
      </nav>
      {lists.length > 1 && (
        <nav className={c.filters} aria-label="Filter by checklist">
          <Link href={href({ show })} className={!list ? c.filterOn : c.filter}>
            Every checklist
          </Link>
          {lists.map((l) => (
            <Link key={l} href={href({ show, list: l })} className={list === l ? c.filterOn : c.filter}>
              {l}
            </Link>
          ))}
        </nav>
      )}

      {shown.length === 0 && <p className={c.hint}>No clients match this filter.</p>}
      <ul className={c.clientList}>
        {shown.map(({ cl, stage, list: listName }) => {
          const answered = cl.items.filter((i) => i.status !== "REQUESTED").length;
          const pct = Math.round((answered / Math.max(1, cl.items.length)) * 100);
          return (
            <li key={cl.id} className={c.clientCard}>
              <details open={stage === "review"}>
                <summary className={c.clientSummary}>
                  <span className={c.avatar}>{initials(cl.name)}</span>
                  <span className={c.personText}>
                    <b>{cl.name}</b>
                    <span>
                      {cl.email} · {listName}
                    </span>
                  </span>
                  <span className={c.progress} title={`${answered} of ${cl.items.length} answered`}>
                    <span className={c.progressText}>
                      {answered} of {cl.items.length}
                    </span>
                    <span className={c.bar}>
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <span className={`${c.stagePill} ${c[`stage_${stage}`]}`}>{STAGE_LABELS[stage]}</span>
                  <Icon name="chevronDown" size={16} />
                </summary>

                <div className={c.clientBody}>
                  <div className={c.clientActions}>
                    <form>
                      <input type="hidden" name="id" value={cl.id} />
                      {cl.status === "ACTIVE" && (
                        <button type="submit" formAction={act.bind(null, "remind")} className={c.smallBtn} disabled={cl.chaseCount >= MAX_CHASES}>
                          <Icon name="mail" size={14} /> Remind now
                        </button>
                      )}
                      {cl.status === "ACTIVE" && (
                        <button type="submit" formAction={act.bind(null, "pause")} className={c.smallBtn}>
                          <Icon name="pause" size={14} /> Pause
                        </button>
                      )}
                      {cl.status === "PAUSED" && (
                        <button type="submit" formAction={act.bind(null, "resume")} className={c.smallBtn}>
                          Resume
                        </button>
                      )}
                    </form>
                    <span className={c.meta}>
                      {startsLater(cl.startAt) && cl.startAt
                        ? `First email on ${cl.startAt.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}`
                        : `${cl.chaseCount} of ${MAX_CHASES} emails sent`}
                      {cl.items.some((i) => i.filePathname) && (
                        <>
                          {" · "}
                          <a href={`/api/doc-chaser/zip/${cl.id}`} className={c.inlineLink}>
                            Download all files (.zip)
                          </a>
                        </>
                      )}
                    </span>
                  </div>

                  <ul className={c.docList}>
                    {cl.items.map((i) => (
                      <li key={i.id} className={c.doc}>
                        <span className={c.docText}>
                          <span className={i.status === "ACCEPTED" || i.status === "NOT_APPLICABLE" ? c.docDone : undefined}>
                            {i.status === "ACCEPTED" && <Icon name="check" size={13} strokeWidth={2.4} />} {i.label}
                          </span>
                          {i.status === "REQUESTED" && i.rejectReason && <small>Sent back: {i.rejectReason}</small>}
                          {i.status === "NOT_APPLICABLE" && <small>Client says they don&apos;t have this{i.clientNote ? `: "${i.clientNote}"` : "."}</small>}
                          {i.fileDeletedAt && !i.filePathname && <small>File deleted after {FILE_RETENTION_DAYS} days</small>}
                          {i.status === "RECEIVED" && i.aiVerdict && (
                            <small className={i.aiVerdict === "check" ? c.aiCheck : c.aiOk}>
                              {i.aiVerdict === "check" ? "AI check, look closely: " : "AI check: "}
                              {i.aiNote || (i.aiVerdict === "ok" ? "looks right." : "this may not be the right document.")}
                            </small>
                          )}
                        </span>
                        <span className={c.docActions}>
                          {i.filePathname && (
                            <a href={`/api/doc-chaser/file/${i.id}`} target="_blank" rel="noopener noreferrer" className={c.smallBtn}>
                              View file
                            </a>
                          )}
                          {i.status === "RECEIVED" && (
                            <form className={c.inlineForm}>
                              <input type="hidden" name="id" value={i.id} />
                              <button type="submit" formAction={review.bind(null, "accept")} className={c.acceptBtn}>
                                Accept
                              </button>
                              <select name="reason" className={c.smallSelect} aria-label={`Reason to send back ${i.label}`} defaultValue="">
                                <option value="" disabled>
                                  Send back because...
                                </option>
                                {REJECT_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" formAction={review.bind(null, "reject")} className={c.smallBtn}>
                                Send back
                              </button>
                            </form>
                          )}
                          {i.status === "NOT_APPLICABLE" && (
                            <form>
                              <input type="hidden" name="id" value={i.id} />
                              <button type="submit" formAction={act.bind(null, "reask")} className={c.smallBtn}>
                                Ask again
                              </button>
                            </form>
                          )}
                          {i.status === "ACCEPTED" && <span className={c.docState}>Accepted</span>}
                          {i.status === "REQUESTED" && <span className={c.docState}>Waiting</span>}
                          {i.status === "REQUESTED" && !i.filePathname && cl.items.length > 1 && (
                            <form>
                              <input type="hidden" name="id" value={i.id} />
                              <button type="submit" formAction={act.bind(null, "remove-doc")} className={c.iconBtn} aria-label={`Stop asking ${cl.name} for ${i.label}`} title="Stop asking for this">
                                <Icon name="x" size={14} />
                              </button>
                            </form>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className={c.clientTools}>
                    {cl.items.length < MAX_ITEMS && (
                      <form className={c.toolForm}>
                        <input type="hidden" name="id" value={cl.id} />
                        <input name="label" required maxLength={160} placeholder="Ask for another document" aria-label={`Ask ${cl.name} for another document`} className={c.smallInput} />
                        <button type="submit" formAction={act.bind(null, "add-doc")} className={c.smallBtn}>
                          <Icon name="plus" size={14} /> Add
                        </button>
                      </form>
                    )}
                    <ChangeChecklist clientId={cl.id} clientName={cl.name} current={listName} options={options} act={act} />
                  </div>
                  <p className={c.meta}>Changing the checklist keeps everything already sent, and adds the new documents to chase.</p>

                  <details className={c.more}>
                    <summary>Upload link and delete</summary>
                    <CopyField label="Private link, only share it with this client" value={uploadUrlFor(cl.uploadToken)} />
                    <form style={{ marginTop: 10 }}>
                      <input type="hidden" name="id" value={cl.id} />
                      <button type="submit" formAction={act.bind(null, "delete")} className={c.dangerBtn}>
                        Delete this client and every file they uploaded
                      </button>
                    </form>
                  </details>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
