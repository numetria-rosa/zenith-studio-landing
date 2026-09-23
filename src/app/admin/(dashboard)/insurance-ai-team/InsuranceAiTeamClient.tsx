"use client";

import { useEffect, useState } from "react";

type CrmEntry = {
  id: string;
  agencyName: string;
  leadName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  forwardedToMake: boolean;
  createdAt: string;
};

type Policy = {
  id: string;
  agencyName: string;
  clientName: string;
  email: string | null;
  policyType: string | null;
  renewalDate: string;
  lastReminderSentAt: string | null;
};

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-1 text-sm text-white/50">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DocumentAudit() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAudit() {
    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    if (file) form.set("file", file);
    if (text.trim()) form.set("text", text.trim());
    try {
      const res = await fetch("/api/insurance-ai-team/document-audit", { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; summary?: string; error?: string };
      if (!data.ok) setError(data.error ?? "audit failed");
      else setResult(data.summary ?? "");
    } catch {
      setError("request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="1. Underwriter's Assistant (Document Audit)" subtitle="Paste policy text or upload a PDF/.txt. Runs on Claude Haiku.">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste ACORD form, loss run, or policy declarations text here..."
        rows={6}
        className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-white/60"
        />
        <button
          onClick={runAudit}
          disabled={loading || (!text.trim() && !file)}
          className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40"
        >
          {loading ? "Running..." : "Run audit"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {result && (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/85">
          {result}
        </pre>
      )}
    </Card>
  );
}

function CrmLogging() {
  const [entries, setEntries] = useState<CrmEntry[]>([]);
  const [agencyName, setAgencyName] = useState("");
  const [leadName, setLeadName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/insurance-ai-team/crm-log");
    if (!res.ok) return;
    const data = (await res.json()) as { entries: CrmEntry[] };
    setEntries(data.entries);
  }

  useEffect(() => {
    load();
  }, []);

  async function logLead() {
    if (!agencyName.trim() || !leadName.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/insurance-ai-team/crm-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, leadName, phone, email, notes }),
      });
      setLeadName("");
      setPhone("");
      setEmail("");
      setNotes("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="2. CRM & Logging Agent" subtitle="Logs to this app's DB and forwards to the Make.com scenario (Insurance CRM Log data store).">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder="Agency name"
          className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm placeholder:text-white/30 focus:outline-none"
        />
        <input
          value={leadName}
          onChange={(e) => setLeadName(e.target.value)}
          placeholder="Lead name"
          className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm placeholder:text-white/30 focus:outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm placeholder:text-white/30 focus:outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm placeholder:text-white/30 focus:outline-none"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm placeholder:text-white/30 focus:outline-none sm:col-span-2"
        />
      </div>
      <button
        onClick={logLead}
        disabled={loading || !agencyName.trim() || !leadName.trim()}
        className="mt-3 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40"
      >
        Log lead
      </button>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/40">
            <tr>
              <th className="py-1 pr-4">Agency</th>
              <th className="py-1 pr-4">Lead</th>
              <th className="py-1 pr-4">Contact</th>
              <th className="py-1 pr-4">Make.com</th>
              <th className="py-1 pr-4">Logged</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-white/5">
                <td className="py-1.5 pr-4">{e.agencyName}</td>
                <td className="py-1.5 pr-4">{e.leadName}</td>
                <td className="py-1.5 pr-4 text-white/60">{[e.phone, e.email].filter(Boolean).join(" / ") || "-"}</td>
                <td className="py-1.5 pr-4">{e.forwardedToMake ? "synced" : "-"}</td>
                <td className="py-1.5 pr-4 text-white/40">{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-white/40">
                  No leads logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const CSV_PLACEHOLDER = `agencyName,clientName,phone,email,policyType,renewalDate
Bixler Insurance Agency LLC,Jane Doe,614-555-0100,jane@example.com,Auto,2026-10-05`;

function Renewals() {
  const [csv, setCsv] = useState("");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<{ clientName: string; sent: boolean; reason?: string }[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/insurance-ai-team/policies");
    if (!res.ok) return;
    const data = (await res.json()) as { policies: Policy[] };
    setPolicies(data.policies);
  }

  useEffect(() => {
    load();
  }, []);

  async function importCsv() {
    setLoading(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/insurance-ai-team/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = (await res.json()) as { ok: boolean; created?: number; error?: string };
      setImportResult(data.ok ? `Imported ${data.created} polic${data.created === 1 ? "y" : "ies"}.` : (data.error ?? "import failed"));
      if (data.ok) {
        setCsv("");
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendTestReminders() {
    setLoading(true);
    setSendResults(null);
    try {
      const res = await fetch("/api/insurance-ai-team/policies/test-send", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string; results?: { clientName: string; sent: boolean; reason?: string }[] };
      if (data.ok) {
        setSendResults(data.results ?? []);
        await load();
      } else {
        setImportResult(data.error ?? "send failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="3. Active Renewal Agent" subtitle="Import policies by CSV, then send renewal reminder emails (Resend) - a real cron also checks daily at 19:00 UTC.">
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={CSV_PLACEHOLDER}
        rows={5}
        className="w-full rounded-xl border border-white/15 bg-black/30 p-3 font-mono text-xs text-white/90 placeholder:text-white/30 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={importCsv}
          disabled={loading || !csv.trim()}
          className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40"
        >
          Import CSV
        </button>
        <button
          onClick={sendTestReminders}
          disabled={loading || policies.length === 0}
          className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-40"
        >
          Send test reminders now
        </button>
      </div>
      {importResult && <p className="mt-3 text-sm text-white/60">{importResult}</p>}

      {sendResults && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
          {sendResults.map((r, i) => (
            <p key={i} className={r.sent ? "text-emerald-300" : "text-white/50"}>
              {r.clientName}: {r.sent ? "reminder sent" : (r.reason ?? "skipped")}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/40">
            <tr>
              <th className="py-1 pr-4">Agency</th>
              <th className="py-1 pr-4">Client</th>
              <th className="py-1 pr-4">Policy</th>
              <th className="py-1 pr-4">Renews</th>
              <th className="py-1 pr-4">Last reminded</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="py-1.5 pr-4">{p.agencyName}</td>
                <td className="py-1.5 pr-4">{p.clientName}</td>
                <td className="py-1.5 pr-4 text-white/60">{p.policyType ?? "-"}</td>
                <td className="py-1.5 pr-4">{new Date(p.renewalDate).toLocaleDateString()} ({daysUntil(p.renewalDate)}d)</td>
                <td className="py-1.5 pr-4 text-white/40">{p.lastReminderSentAt ? new Date(p.lastReminderSentAt).toLocaleString() : "never"}</td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-white/40">
                  No policies imported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function InsuranceAiTeamClient() {
  return (
    <div>
      <DocumentAudit />
      <CrmLogging />
      <Renewals />
    </div>
  );
}
