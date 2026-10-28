"use client";

import { useState, useTransition } from "react";
import { applyColumns, columnLetter, emailIn, guessColumns, readTable, type Columns, type Table } from "@/lib/client-import";
import { cleanItems, detectChecklist } from "@/lib/document-chaser";
import { Icon } from "../../Icon";
import c from "./chaser.module.css";

/** A checklist the accountant can pick: a standard one ("std:<id>") or one of the firm's saved ones ("saved:<id>"). */
type Option = { key: string; name: string; group: string; items: string[] };
type Row = { name: string; email: string; key: string };
type Importing = { table: Table; cols: Columns; source: string };
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const DEFAULT = "default";
const GROUPS: [string, string][] = [
  ["Yours", "Your checklists"],
  ["US", "United States"],
  ["UK", "United Kingdom"],
  ["Any", "Any country"],
];

/* Setup for the AI Document Chaser:
   1. the default document list (a standard or saved checklist, edited if needed, savable as the firm's own),
   2. the clients, typed, from a file (CSV, Excel) or pasted from a spreadsheet, each with their own checklist,
   3. review and start.
   Every value is re-validated on the server; this screen only makes it quick and visible. */
export function DocChaserSetup({
  checklists,
  extras,
  maxItems,
  businessName,
  gapDays,
  maxChases,
  retentionDays,
  first,
  addAction,
  testAction,
  readSpreadsheet,
  saveChecklist,
  deleteChecklist,
}: {
  checklists: Option[];
  extras: string[];
  maxItems: number;
  businessName: string;
  gapDays: number;
  maxChases: number;
  retentionDays: number;
  first: boolean;
  addAction: (fd: FormData) => Promise<void>;
  testAction: (fd: FormData) => Promise<{ ok: boolean; message: string }>;
  readSpreadsheet: (fd: FormData) => Promise<Result<{ table: string[][] }>>;
  saveChecklist: (fd: FormData) => Promise<Result<{ id: string }>>;
  deleteChecklist: (fd: FormData) => Promise<{ ok: boolean }>;
}) {
  const [options, setOptions] = useState(checklists);
  const [defaultKey, setDefaultKey] = useState(checklists.find((o) => o.group !== "Yours")?.key ?? checklists[0]!.key);
  const [items, setItems] = useState<string[]>(() => [...(checklists.find((o) => o.key === defaultKey)?.items ?? [])]);
  const [picked, setPicked] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [showItems, setShowItems] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [mode, setMode] = useState<"one" | "file" | "paste">("one");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pasted, setPasted] = useState("");
  const [importing, setImporting] = useState<Importing | null>(null);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, startBusy] = useTransition();

  const base = options.find((o) => o.key === defaultKey) ?? options[0]!;
  const defaultItems = cleanItems([...items, ...picked]);
  const edited = items.join("|") !== base.items.join("|");
  const resolve = (key: string) => (key === DEFAULT ? { name: base.name, items: defaultItems } : (options.find((o) => o.key === key) ?? { name: base.name, items: defaultItems }));

  // A client typed but never "Add"-ed still counts: forgetting the Add button must not lose them.
  const draftEmail = emailIn(email);
  const all = draftEmail && !rows.some((r) => r.email === draftEmail) ? [...rows, { name: name.trim() || draftEmail.split("@")[0]!, email: draftEmail, key: DEFAULT }] : rows;
  const payload = all.map((r) => ({ name: r.name, email: r.email, checklist: resolve(r.key).name, items: resolve(r.key).items }));
  const listCount = new Set(payload.map((p) => p.checklist)).size;
  const first1 = all[0];
  const previewItems = first1 ? resolve(first1.key).items : defaultItems;

  // ---------- step 1 ----------
  function pickDefault(key: string) {
    setDefaultKey(key);
    setItems([...(options.find((o) => o.key === key)?.items ?? [])]);
    setPicked([]);
  }
  function addItem() {
    const label = newItem.trim();
    if (!label || defaultItems.length >= maxItems) return;
    if (!defaultItems.some((i) => i.toLowerCase() === label.toLowerCase())) setItems((cur) => [...cur, label]);
    setNewItem("");
  }
  function saveAsMine() {
    const fd = new FormData();
    fd.set("name", saveName);
    defaultItems.forEach((i) => fd.append("items", i));
    startBusy(async () => {
      const r = await saveChecklist(fd);
      if (!r.ok) return setNote({ ok: false, text: r.error });
      const opt = { key: `saved:${r.id}`, name: saveName.replace(/\s+/g, " ").trim(), group: "Yours", items: defaultItems };
      setOptions((cur) => [opt, ...cur.filter((o) => o.key !== opt.key && !(o.group === "Yours" && o.name === opt.name))]);
      setDefaultKey(opt.key);
      setItems(defaultItems);
      setPicked([]);
      setSaveName("");
      setNote({ ok: true, text: `Saved "${opt.name}". It's in every checklist menu from now on.` });
    });
  }
  function deleteMine() {
    if (!window.confirm(`Delete the saved checklist "${base.name}"? Clients already using it keep their documents.`)) return;
    const fd = new FormData();
    fd.set("id", base.key.slice("saved:".length));
    startBusy(async () => {
      const r = await deleteChecklist(fd);
      if (!r.ok) return setNote({ ok: false, text: "That checklist couldn't be deleted. Try again." });
      const rest = options.filter((o) => o.key !== base.key);
      setOptions(rest);
      setRows((cur) => cur.map((row) => (row.key === base.key ? { ...row, key: DEFAULT } : row)));
      pickDefault(rest.find((o) => o.group !== "Yours")!.key);
    });
  }

  // ---------- step 2 ----------
  function addRows(list: { name: string; email: string; key: string }[], skipped: number, from: string) {
    const known = new Set(rows.map((r) => r.email));
    const fresh = list.filter((r) => !known.has(r.email) && known.add(r.email));
    setRows((cur) => [...cur, ...fresh]);
    const dupes = list.length - fresh.length + skipped;
    setNote({
      ok: fresh.length > 0,
      text: `${fresh.length} client${fresh.length === 1 ? "" : "s"} added${from ? ` from ${from}` : ""}.${dupes ? ` ${dupes} row${dupes === 1 ? "" : "s"} skipped (no valid email, or already on the list).` : ""}`,
    });
  }
  function addOne() {
    if (!draftEmail) return setNote({ ok: false, text: "That email doesn't look right." });
    addRows([{ name: name.trim() || draftEmail.split("@")[0]!, email: draftEmail, key: DEFAULT }], 0, "");
    setName("");
    setEmail("");
  }
  function enterAdds(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (email.trim()) addOne();
  }

  function startImport(table: Table, source: string) {
    if (!table.length) return setNote({ ok: false, text: `${source} is empty.` });
    const cols = guessColumns(table);
    if (cols.email < 0) return setNote({ ok: false, text: `No email addresses found in ${source}. The list needs a column with each client's email.` });
    setNote(null);
    setImporting({ table, cols, source });
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    if (/\.xls$/i.test(file.name)) return setNote({ ok: false, text: "That's an old .xls file. In Excel choose File, Save As, then Excel Workbook (.xlsx) or CSV." });
    if (/\.xlsx$/i.test(file.name)) {
      const fd = new FormData();
      fd.set("file", file);
      return startBusy(async () => {
        const r = await readSpreadsheet(fd);
        if (!r.ok) return setNote({ ok: false, text: r.error });
        startImport(r.table, file.name);
      });
    }
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && !/text\//.test(file.type)) return setNote({ ok: false, text: "Pick a CSV or Excel (.xlsx) file, or copy the rows and use Paste." });
    startImport(readTable(await file.text()), file.name);
  }
  function finishImport() {
    if (!importing) return;
    const { clients, skipped } = applyColumns(importing.table, importing.cols);
    const saved = options.filter((o) => o.group === "Yours").map((o) => ({ id: o.key, name: o.name }));
    addRows(clients.map((cl) => ({ name: cl.name, email: cl.email, key: keyFor(cl.checklistHint, saved) })), skipped, importing.source);
    setImporting(null);
    setPasted("");
  }

  const toggle = (emailAddr: string) => setSelected((cur) => (cur.includes(emailAddr) ? cur.filter((x) => x !== emailAddr) : [...cur, emailAddr]));
  const setKey = (emails: string[], key: string) => setRows((cur) => cur.map((r) => (emails.includes(r.email) ? { ...r, key } : r)));

  function testFields(): FormData {
    const fd = new FormData();
    previewItems.forEach((i) => fd.append("items", i));
    return fd;
  }

  const listSelect = (value: string, onChange: (v: string) => void, label: string, placeholder?: string) => (
    <select className={c.rowSelect} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      <option value={DEFAULT}>Step 1 list: {base.name}</option>
      {GROUPS.map(([g, title]) => {
        const opts = options.filter((o) => o.group === g);
        return opts.length ? (
          <optgroup key={g} label={title}>
            {opts.map((o) => (
              <option key={o.key} value={o.key}>
                {o.name} ({o.items.length})
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
    </select>
  );

  return (
    <div className={c.layout}>
      <form
        className={c.card}
        action={addAction}
        onSubmit={(e) => {
          if (!payload.length || payload.some((p) => !p.items.length)) e.preventDefault();
        }}
      >
        <input type="hidden" name="clients" value={JSON.stringify(payload)} />

        <header className={c.cardHead}>
          <h2 className={c.cardTitle}>{first ? "Add your first clients" : "Add more clients"}</h2>
          <p className={c.cardSub}>Three steps, about two minutes. Nothing is sent until you press Start.</p>
        </header>

        {/* ---------- 1 ---------- */}
        <section className={c.step}>
          <span className={c.num}>1</span>
          <div className={c.stepBody}>
            <h3 className={c.stepTitle}>What do you usually need?</h3>
            <p className={c.stepSub}>This is the default list for everyone you add below. You can give any client a different checklist in step 2.</p>

            <p className={c.eyebrow}>Default checklist</p>
            <label className={c.select}>
              <Icon name="file" size={18} />
              <select value={defaultKey} onChange={(e) => pickDefault(e.target.value)} aria-label="Default checklist">
                {GROUPS.map(([g, title]) => {
                  const opts = options.filter((o) => o.group === g);
                  return opts.length ? (
                    <optgroup key={g} label={title}>
                      {opts.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
              <span className={c.badge}>
                {items.length} document{items.length === 1 ? "" : "s"}
                {edited ? ", edited" : ""}
              </span>
              <Icon name="chevronDown" size={18} />
            </label>
            <div className={c.linkRow}>
              <button type="button" className={c.link} onClick={() => setShowItems(!showItems)} aria-expanded={showItems}>
                {showItems ? "Done editing" : `View or edit the ${items.length} documents`}
              </button>
              {edited && (
                <button type="button" className={c.linkMuted} onClick={() => setItems([...base.items])}>
                  Undo my changes
                </button>
              )}
              {base.group === "Yours" && (
                <button type="button" className={c.linkMuted} onClick={deleteMine} disabled={busy}>
                  Delete this saved checklist
                </button>
              )}
            </div>
            {showItems && (
              <div className={c.editor}>
                <ul className={c.editList}>
                  {items.map((i) => (
                    <li key={i}>
                      <span>{i}</span>
                      <button type="button" className={c.remove} aria-label={`Stop asking for ${i}`} onClick={() => setItems((cur) => cur.filter((x) => x !== i))}>
                        <Icon name="x" size={15} />
                      </button>
                    </li>
                  ))}
                  {items.length === 0 && <li className={c.empty}>No documents yet. Add one below or tick an extra.</li>}
                </ul>
                <div className={c.addItem}>
                  <span className={c.inputWrap}>
                    <Icon name="plus" size={16} />
                    <input
                      value={newItem}
                      maxLength={160}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      placeholder="Add a document, e.g. Payslips for March"
                      aria-label="Add a document"
                    />
                  </span>
                  <button type="button" className={c.addBtn} onClick={addItem} disabled={!newItem.trim() || defaultItems.length >= maxItems}>
                    Add
                  </button>
                </div>
                <div className={c.addItem}>
                  <span className={c.inputWrap}>
                    <Icon name="file" size={16} />
                    <input
                      value={saveName}
                      maxLength={80}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (saveName.trim()) saveAsMine();
                        }
                      }}
                      placeholder='Save this list for later, e.g. "1040 with rental"'
                      aria-label="Name for this checklist"
                    />
                  </span>
                  <button type="button" className={c.addBtn} onClick={saveAsMine} disabled={!saveName.trim() || !defaultItems.length || busy}>
                    Save
                  </button>
                </div>
              </div>
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
                  <button key={e} type="button" className={`${c.extra} ${on ? c.extraOn : ""}`} aria-pressed={on} onClick={() => setPicked((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]))}>
                    <span className={c.box}>{on && <Icon name="check" size={14} strokeWidth={2.6} />}</span>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- 2 ---------- */}
        <section className={c.step}>
          <span className={c.num}>2</span>
          <div className={c.stepBody}>
            <h3 className={c.stepTitle}>Who should we chase?</h3>
            <p className={c.stepSub}>Type them in, upload your client list (CSV or Excel, from any software), or paste rows straight from a spreadsheet.</p>
            <div className={c.tabs} role="tablist" style={{ marginTop: 18, alignSelf: "flex-start", width: "fit-content" }}>
              {(
                [
                  ["one", "plus", "One by one"],
                  ["file", "upload", "Upload a file"],
                  ["paste", "clipboard", "Paste rows"],
                ] as const
              ).map(([m, icon, label]) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? c.tabOn : c.tab} onClick={() => setMode(m)}>
                  <Icon name={icon} size={15} /> {label}
                </button>
              ))}
            </div>

            {importing ? (
              <ColumnCheck importing={importing} setImporting={setImporting} onCancel={() => setImporting(null)} onDone={finishImport} options={options} />
            ) : mode === "one" ? (
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
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={enterAdds} placeholder="jane@example.com" />
                  </span>
                </label>
                <button type="button" className={c.addBtn} onClick={addOne} disabled={!email.trim()}>
                  <Icon name="plus" size={16} /> Add
                </button>
              </div>
            ) : mode === "file" ? (
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
                <p className={c.dropTitle}>{busy ? "Reading your file..." : "Drop your client list here"}</p>
                <p className={c.dropSub}>
                  CSV or Excel (.xlsx), exported from Drake, ProSeries, Lacerte, UltraTax, QuickBooks, Karbon, TaxDome or any spreadsheet. It just needs a column with
                  each client&apos;s email. You&apos;ll check the columns before anything is added.
                </p>
                {/* A label around the input: the browser opens the file picker itself. */}
                <label className={c.ghostBtn}>
                  Choose a file
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className={c.fileInput}
                    onChange={(e) => {
                      readFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className={c.pasteBox}>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={6}
                  placeholder={"Select the rows in Excel or Google Sheets (headings too), copy, and paste here.\n\nName        Email                Return type\nJane Doe    jane@example.com     1040"}
                  aria-label="Paste client rows"
                />
                <button type="button" className={c.addBtn} disabled={!pasted.trim()} onClick={() => startImport(readTable(pasted), "the pasted rows")}>
                  Read these rows
                </button>
              </div>
            )}

            {note && (
              <p role="status" className={note.ok ? c.noteOk : c.noteBad}>
                {note.text}
              </p>
            )}

            {rows.length > 0 && (
              <div className={c.rows}>
                <div className={c.rowsHead}>
                  <label className={c.checkLabel}>
                    <input type="checkbox" checked={selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.email) : [])} />
                    {selected.length ? `${selected.length} selected` : `${rows.length} client${rows.length === 1 ? "" : "s"}`}
                  </label>
                  {selected.length > 0 && (
                    <span className={c.bulk}>
                      {listSelect("", (v) => v && setKey(selected, v), "Checklist for the selected clients", "Set checklist for these...")}
                      <button
                        type="button"
                        className={c.smallBtn}
                        onClick={() => {
                          setRows((cur) => cur.filter((r) => !selected.includes(r.email)));
                          setSelected([]);
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </div>
                <ul className={c.pending}>
                  {rows.map((r) => (
                    <li key={r.email} className={c.person}>
                      <input type="checkbox" checked={selected.includes(r.email)} onChange={() => toggle(r.email)} aria-label={`Select ${r.name}`} />
                      <span className={c.personText}>
                        <b>{r.name}</b>
                        <span>{r.email}</span>
                      </span>
                      {listSelect(r.key, (v) => setKey([r.email], v), `Checklist for ${r.name}`)}
                      <button
                        type="button"
                        className={c.remove}
                        aria-label={`Remove ${r.name}`}
                        onClick={() => {
                          setRows((cur) => cur.filter((x) => x.email !== r.email));
                          setSelected((cur) => cur.filter((x) => x !== r.email));
                        }}
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ---------- 3 ---------- */}
        <section className={c.step}>
          <span className={c.num}>3</span>
          <div className={c.stepBody}>
            <h3 className={c.stepTitle}>Review and start</h3>
            <p className={c.stepSub}>Emails go out in your firm&apos;s name. You can pause, edit or delete any client later.</p>
            <div className={c.chips}>
              <span className={c.chip}>
                <Icon name="users" size={15} /> {payload.length} client{payload.length === 1 ? "" : "s"}
              </span>
              <span className={c.chip}>
                <Icon name="file" size={15} /> {listCount > 1 ? `${listCount} different checklists` : `${(payload[0]?.items ?? defaultItems).length} documents each`}
              </span>
              <span className={c.chip}>
                <Icon name="calendar" size={15} /> Reminder every {gapDays} days, up to {maxChases}
              </span>
            </div>
            <div className={c.actions}>
              <button type="submit" className={c.start} disabled={!payload.length || payload.some((p) => !p.items.length)}>
                Start chasing <Icon name="arrowRight" size={18} />
              </button>
              <button
                type="button"
                className={c.testBtn}
                disabled={busy || !previewItems.length}
                onClick={() =>
                  startBusy(async () => {
                    const r = await testAction(testFields());
                    setNote({ ok: r.ok, text: r.message });
                  })
                }
              >
                <Icon name="mail" size={16} /> Send me a test email first
              </button>
            </div>
            {!defaultItems.length && <p className={c.hint}>Add at least one document in step 1 to start.</p>}
            {!payload.length && <p className={c.hint}>Add at least one client in step 2 to start.</p>}
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
              From {businessName} · to {first1?.name || "Jane Doe"}
            </p>
            <p className={c.mailSubject}>Documents needed by {businessName}</p>
            <p className={c.mailText}>
              Hi {first1?.name.split(/\s+/)[0] || "Jane"}, we need a few documents from you to get your work done. Upload them securely below, no account needed.
            </p>
            <ul className={c.mailList}>
              {previewItems.slice(0, 5).map((i) => (
                <li key={i}>
                  <i /> {i}
                </li>
              ))}
              {previewItems.length > 5 && <li className={c.mailMore}>and {previewItems.length - 5} more</li>}
            </ul>
            <span className={c.mailBtn}>Upload securely</span>
          </div>
        </div>

        <div className={c.sideCard}>
          <p className={c.eyebrow}>How chasing works</p>
          <ol className={c.timeline}>
            <Stage icon="mail" title="Day 0" text="Your client gets the email with a private upload link, as soon as you press Start." />
            <Stage icon="calendar" title={`Every ${gapDays} days`} text={`A friendly reminder, up to ${maxChases} times, only for what's still missing.`} />
            <Stage icon="check" title="Stops on its own" text="Once everything is uploaded, or the client tells you they don't have it." />
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

/** A spreadsheet value ("1040", "S Corp") to a checklist key; anything unrecognised uses the step 1 list. */
function keyFor(hint: string, saved: { id: string; name: string }[]): string {
  const hit = detectChecklist(hint, saved);
  return !hit ? DEFAULT : hit.startsWith("saved:") ? hit : `std:${hit}`;
}

/* "Check your columns": shows what we read and lets the accountant fix any guess before clients are added. */
function ColumnCheck({
  importing,
  setImporting,
  onCancel,
  onDone,
  options,
}: {
  importing: Importing;
  setImporting: (i: Importing) => void;
  onCancel: () => void;
  onDone: () => void;
  options: Option[];
}) {
  const { table, cols, source } = importing;
  const width = Math.max(...table.map((r) => r.length));
  const head = table[0] ?? [];
  const label = (i: number) => (cols.hasHeader && head[i] ? `${columnLetter(i)}: ${head[i]}` : `Column ${columnLetter(i)}`);
  const set = (patch: Partial<Columns>) => setImporting({ ...importing, cols: { ...cols, ...patch } });
  const split = cols.first >= 0;
  const { clients, skipped } = applyColumns(table, cols);
  const saved = options.filter((o) => o.group === "Yours").map((o) => ({ id: o.key, name: o.name }));
  const nameOf = (hint: string) => {
    const k = keyFor(hint, saved);
    return k === DEFAULT ? "Step 1 list" : (options.find((o) => o.key === k)?.name ?? "Step 1 list");
  };
  const colSelect = (value: number, onChange: (v: number) => void, aria: string, none?: string) => (
    <select className={c.rowSelect} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={aria}>
      {none && <option value={-1}>{none}</option>}
      {Array.from({ length: width }, (_, i) => (
        <option key={i} value={i}>
          {label(i)}
        </option>
      ))}
    </select>
  );

  return (
    <div className={c.columns}>
      <p className={c.columnsTitle}>Check your columns</p>
      <p className={c.stepSub} style={{ marginTop: 4 }}>
        We read {source}. Fix anything that&apos;s wrong, then add the clients.
      </p>
      <div className={c.columnGrid}>
        <label className={c.field}>
          <span>Email</span>
          {colSelect(cols.email, (v) => set({ email: v }), "Email column")}
        </label>
        <label className={c.field}>
          <span>Name is in</span>
          <select
            className={c.rowSelect}
            value={split ? "split" : "one"}
            onChange={(e) => (e.target.value === "split" ? set({ first: 0, last: Math.min(1, width - 1), name: -1 }) : set({ first: -1, last: -1, name: 0 }))}
            aria-label="How the name is stored"
          >
            <option value="one">One column</option>
            <option value="split">First and last name columns</option>
          </select>
        </label>
        {split ? (
          <>
            <label className={c.field}>
              <span>First name</span>
              {colSelect(cols.first, (v) => set({ first: v }), "First name column")}
            </label>
            <label className={c.field}>
              <span>Last name</span>
              {colSelect(cols.last, (v) => set({ last: v }), "Last name column", "None")}
            </label>
          </>
        ) : (
          <label className={c.field}>
            <span>Name</span>
            {colSelect(cols.name, (v) => set({ name: v }), "Name column", "None, use the email")}
          </label>
        )}
        <label className={c.field}>
          <span>Checklist from (optional)</span>
          {colSelect(cols.checklist, (v) => set({ checklist: v }), "Checklist column", "None, use the step 1 list")}
        </label>
      </div>
      <label className={c.checkLabel} style={{ marginTop: 12 }}>
        <input type="checkbox" checked={cols.hasHeader} onChange={(e) => set({ hasHeader: e.target.checked })} />
        The first row is headings, not a client
      </label>

      <table className={c.previewTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Checklist</th>
          </tr>
        </thead>
        <tbody>
          {clients.slice(0, 5).map((cl) => (
            <tr key={cl.email}>
              <td>{cl.name}</td>
              <td>{cl.email}</td>
              <td>{nameOf(cl.checklistHint)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={c.meta}>
        {clients.length} client{clients.length === 1 ? "" : "s"} found
        {clients.length > 5 ? ", first 5 shown" : ""}
        {skipped ? `. ${skipped} row${skipped === 1 ? "" : "s"} without a valid email will be skipped` : ""}. You can change any client&apos;s checklist after adding.
      </p>
      <div className={c.actions} style={{ marginTop: 14 }}>
        <button type="button" className={c.addBtn} onClick={onDone} disabled={!clients.length}>
          Add {clients.length} client{clients.length === 1 ? "" : "s"}
        </button>
        <button type="button" className={c.linkMuted} onClick={onCancel}>
          Cancel
        </button>
      </div>
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
