"use client";

import { useRef, useState, useTransition } from "react";
import { parseClientCsv } from "@/lib/document-chaser";
import { Icon } from "../../Icon";
import c from "./chaser.module.css";

type Checklist = { id: string; label: string; items: readonly string[] };
type Pending = { name: string; email: string };

/* Setup card for the AI Document Chaser: pick what to ask for, build the client list (one by one or from a
   CSV, read in the browser so the accountant sees exactly who will be emailed), then start. The server
   action re-validates everything; nothing here is trusted. */
export function DocChaserSetup({
  checklists,
  extras,
  businessName,
  gapDays,
  maxChases,
  retentionDays,
  first,
  addAction,
  testAction,
}: {
  checklists: Checklist[];
  extras: string[];
  businessName: string;
  gapDays: number;
  maxChases: number;
  retentionDays: number;
  first: boolean;
  addAction: (fd: FormData) => Promise<void>;
  testAction: (fd: FormData) => Promise<{ ok: boolean; message: string }>;
}) {
  const [checklistId, setChecklistId] = useState(checklists[0]!.id);
  const [picked, setPicked] = useState<string[]>([]);
  const [showItems, setShowItems] = useState(false);
  const [mode, setMode] = useState<"one" | "list">("one");
  const [pending, setPending] = useState<Pending[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, startTest] = useTransition();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // A client typed into the fields but never "Add"-ed still counts: forgetting the Add button must not lose them.
  const draft = email.trim() ? parseClientCsv(`name,email
"${name.replace(/"/g, "")}",${email.trim()}`).clients[0] : undefined;
  const toSend = draft && !pending.some((p) => p.email === draft.email) ? [...pending, draft] : pending;

  const checklist = checklists.find((l) => l.id === checklistId)!;
  const docCount = checklist.items.length + picked.filter((e) => !checklist.items.includes(e)).length;
  const preview = toSend[0]?.name.split(/\s+/)[0] || "Jane";

  function addMany(list: Pending[], skipped: number, from?: string) {
    const known = new Set(pending.map((p) => p.email));
    const fresh = list.filter((p) => !known.has(p.email));
    setPending([...pending, ...fresh]);
    const dupes = list.length - fresh.length + skipped;
    const added = `${fresh.length} client${fresh.length === 1 ? "" : "s"} added${from ? ` from ${from}` : ""}`;
    setNote({ ok: fresh.length > 0, text: dupes ? `${added}. ${dupes} row${dupes === 1 ? "" : "s"} skipped (no valid email or a duplicate).` : `${added}.` });
  }

  function addOne() {
    const parsed = parseClientCsv(`name,email\n"${name.replace(/"/g, "")}",${email.trim()}`);
    if (!parsed.clients.length) return setNote({ ok: false, text: "That email doesn't look right." });
    addMany(parsed.clients, 0);
    setName("");
    setEmail("");
  }

  // Enter in the add-a-client fields adds that client; it must never submit the whole form.
  function enterAdds(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (email.trim()) addOne();
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return setNote({ ok: false, text: "Pick a .csv file. In Excel or Google Sheets: File, then Download or Save as, then CSV." });
    const parsed = parseClientCsv(await file.text());
    addMany(parsed.clients, parsed.skipped, file.name);
  }

  const togglePick = (e: string) => setPicked((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  function fields(): FormData {
    const fd = new FormData();
    fd.set("checklist", checklistId);
    picked.forEach((e) => fd.append("extras", e));
    return fd;
  }

  return (
    <div className={c.layout}>
      <form
        className={c.card}
        action={addAction}
        onSubmit={(e) => {
          if (!toSend.length) e.preventDefault();
        }}
      >
        <input type="hidden" name="checklist" value={checklistId} />
        {picked.map((e) => (
          <input key={e} type="hidden" name="extras" value={e} />
        ))}
        <input type="hidden" name="csv" value={["name,email", ...toSend.map((p) => `"${p.name.replace(/"/g, "")}",${p.email}`)].join("\n")} />

        <header className={c.cardHead}>
          <h2 className={c.cardTitle}>{first ? "Add your first clients" : "Add more clients"}</h2>
          <p className={c.cardSub}>Three steps, about two minutes. Nothing is sent until you press Start.</p>
        </header>

        <section className={c.step}>
          <span className={c.num}>1</span>
          <div className={c.stepBody}>
            <h3 className={c.stepTitle}>What do you need from them?</h3>
            <p className={c.stepSub}>Pick a checklist, then add anything extra for this batch.</p>

            <p className={c.eyebrow}>Document checklist</p>
            <label className={c.select}>
              <Icon name="file" size={18} />
              <select value={checklistId} onChange={(e) => setChecklistId(e.target.value)} aria-label="Document checklist">
                {checklists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <span className={c.badge}>{checklist.items.length} documents</span>
              <Icon name="chevronDown" size={18} />
            </label>
            <button type="button" className={c.link} onClick={() => setShowItems(!showItems)} aria-expanded={showItems}>
              {showItems ? "Hide" : "View"} the {checklist.items.length} documents
            </button>
            {showItems && (
              <ul className={c.itemList}>
                {checklist.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}

            <div className={c.eyebrowRow}>
              <p className={c.eyebrow}>Also ask for · optional</p>
              {picked.length > 0 && (
                <span className={c.count}>
                  {picked.length} extra{picked.length === 1 ? "" : "s"} selected
                </span>
              )}
            </div>
            <div className={c.extras}>
              {extras.map((e) => {
                const on = picked.includes(e);
                return (
                  <button key={e} type="button" className={`${c.extra} ${on ? c.extraOn : ""}`} aria-pressed={on} onClick={() => togglePick(e)}>
                    <span className={c.box}>{on && <Icon name="check" size={14} strokeWidth={2.6} />}</span>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className={c.step}>
          <span className={c.num}>2</span>
          <div className={c.stepBody}>
            <div className={c.stepHeadRow}>
              <div>
                <h3 className={c.stepTitle}>Who should we chase?</h3>
                <p className={c.stepSub}>Add clients one at a time, or upload a list.</p>
              </div>
              <div className={c.tabs} role="tablist">
                <button type="button" role="tab" aria-selected={mode === "one"} className={mode === "one" ? c.tabOn : c.tab} onClick={() => setMode("one")}>
                  <Icon name="plus" size={15} /> Add one by one
                </button>
                <button type="button" role="tab" aria-selected={mode === "list"} className={mode === "list" ? c.tabOn : c.tab} onClick={() => setMode("list")}>
                  <Icon name="upload" size={15} /> Upload a list
                </button>
              </div>
            </div>

            {mode === "one" ? (
              <div className={c.oneRow}>
                <label className={c.field}>
                  <span>Client name</span>
                  <span className={c.inputWrap}>
                    <Icon name="users" size={17} />
                    <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={enterAdds} placeholder="Jane Doe" />
                  </span>
                </label>
                <label className={c.field}>
                  <span>Client email</span>
                  <span className={c.inputWrap}>
                    <Icon name="mail" size={17} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={enterAdds}
                      placeholder="jane@example.com"
                    />
                  </span>
                </label>
                <button type="button" className={c.addBtn} onClick={addOne} disabled={!email.trim()}>
                  <Icon name="plus" size={16} /> Add
                </button>
              </div>
            ) : (
              <div
                className={`${c.drop} ${dragging ? c.dropOn : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  readFile(e.dataTransfer.files[0]);
                }}
              >
                <Icon name="upload" size={22} />
                <p className={c.dropTitle}>Drop your CSV here</p>
                <p className={c.dropSub}>One row per client, with a name column and an email column. Excel and Google Sheets can both save as CSV.</p>
                <button type="button" className={c.ghostBtn} onClick={() => fileRef.current?.click()}>
                  Choose a CSV file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    readFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {note && (
              <p role="status" className={note.ok ? c.noteOk : c.noteBad}>
                {note.text}
              </p>
            )}

            {pending.length > 0 && (
              <ul className={c.pending}>
                {pending.map((p) => (
                  <li key={p.email} className={c.person}>
                    <span className={c.avatar}>{initials(p.name)}</span>
                    <span className={c.personText}>
                      <b>{p.name}</b>
                      <span>{p.email}</span>
                    </span>
                    <span className={c.ready}>Ready</span>
                    <button type="button" className={c.remove} aria-label={`Remove ${p.name}`} onClick={() => setPending((cur) => cur.filter((x) => x.email !== p.email))}>
                      <Icon name="x" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className={c.step}>
          <span className={c.num}>3</span>
          <div className={c.stepBody}>
            <h3 className={c.stepTitle}>Review and start</h3>
            <p className={c.stepSub}>Emails go out in your firm&apos;s name. You can pause or delete any client later.</p>
            <div className={c.chips}>
              <span className={c.chip}>
                <Icon name="users" size={15} /> {toSend.length} client{toSend.length === 1 ? "" : "s"}
              </span>
              <span className={c.chip}>
                <Icon name="file" size={15} /> {docCount} documents each
              </span>
              <span className={c.chip}>
                <Icon name="calendar" size={15} /> Reminder every {gapDays} days, up to {maxChases}
              </span>
            </div>
            <div className={c.actions}>
              <button type="submit" className={c.start} disabled={!toSend.length}>
                Start chasing <Icon name="arrowRight" size={18} />
              </button>
              <button
                type="button"
                className={c.testBtn}
                disabled={testing}
                onClick={() =>
                  startTest(async () => {
                    const r = await testAction(fields());
                    setNote({ ok: r.ok, text: r.message });
                  })
                }
              >
                <Icon name="mail" size={16} /> {testing ? "Sending..." : "Send me a test email first"}
              </button>
            </div>
            {!toSend.length && <p className={c.hint}>Add at least one client in step 2 to start.</p>}
          </div>
        </section>
      </form>

      <aside className={c.side}>
        <div className={c.sideCard}>
          <div className={c.sideHead}>
            <p className={c.eyebrow}>What your client receives</p>
            <Icon name="mail" size={16} />
          </div>
          <div className={c.mail}>
            <p className={c.mailFrom}>
              From {businessName} · to {toSend[0]?.name || "Jane Doe"}
            </p>
            <p className={c.mailSubject}>Documents needed by {businessName}</p>
            <p className={c.mailText}>Hi {preview}, we need a few documents from you to get your work done. Upload them securely below, no account needed.</p>
            <ul className={c.mailList}>
              <li>
                <i /> {checklist.label} checklist ({checklist.items.length})
              </li>
              {picked.map((e) => (
                <li key={e}>
                  <i /> {e}
                </li>
              ))}
            </ul>
            <span className={c.mailBtn}>Upload securely</span>
          </div>
        </div>

        <div className={c.sideCard}>
          <p className={c.eyebrow}>How chasing works</p>
          <ol className={c.timeline}>
            <Stage icon="mail" title="Day 0" text="Your client gets the email with a private upload link, as soon as you press Start." />
            <Stage icon="calendar" title={`Every ${gapDays} days`} text={`A friendly reminder, up to ${maxChases} times, only for what's still missing.`} />
            <Stage icon="check" title="Stops on its own" text="As soon as everything is in. You accept each file." />
            <Stage icon="message" title="Replies" text="Go straight to your own inbox." />
          </ol>
        </div>

        <div className={c.notice}>
          <Icon name="shield" size={18} />
          <div>
            <b>Files are deleted after {retentionDays} days</b>
            <p>Save each one to your own records once you&apos;ve accepted it.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stage({ icon, title, text }: { icon: "mail" | "calendar" | "check" | "message"; title: string; text: string }) {
  return (
    <li className={c.stage}>
      <span className={c.stageIcon}>
        <Icon name={icon} size={16} />
      </span>
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </li>
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
