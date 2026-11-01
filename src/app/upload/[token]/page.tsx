import Link from "next/link";
import { notFound } from "next/navigation";
import { getUploadPortal } from "@/lib/document-chaser-db";
import { DropZone } from "./DropZone";
import { ItemActions } from "./ItemActions";
import { FILE_RETENTION_DAYS, docHint } from "@/lib/document-chaser";

export const metadata = { title: "Upload your documents", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TIPS = [
  "Lay the page flat in good light, all four corners in view.",
  "One photo per page is fine. Use Add another file for the rest.",
  "Blurry or cut off? Just hit Replace and send a new one.",
];

const EYEBROW = "m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45";
const COUNT = "ml-1 rounded-full bg-white/10 px-2 py-0.5 text-white/70";

/* The private page a client opens from their accountant's email: what's still needed, one drop zone each,
   no account. Files go to private storage that only the accountant can open. */
export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await getUploadPortal(token);
  if (!portal) notFound();
  const { client, businessName } = portal;
  const first = client.name.trim().split(/\s+/)[0];
  const items = client.items.map((item, i) => ({ item, n: String(i + 1).padStart(2, "0") }));
  const na = items.filter((x) => x.item.status === "NOT_APPLICABLE");
  const active = items.filter((x) => x.item.status !== "NOT_APPLICABLE");
  const sent = items.filter((x) => x.item.status === "RECEIVED" || x.item.status === "ACCEPTED").length;
  const total = items.length;
  const todo = total - sent - na.length;
  const pct = total ? Math.round(((sent + na.length) / total) * 100) : 0;
  const seg = (v: number) => (total ? `${(v / total) * 100}%` : "0%");

  return (
    <main className="min-h-screen bg-[#05060a] px-4 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-12">
        <aside className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 flex-none place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-[18px] font-semibold" aria-hidden="true">
                {businessName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-medium">{businessName}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">Document request</span>
              </span>
            </div>
            <span className="flex-none rounded-full border border-white/15 px-3 py-1 text-[12px] text-white/60">Private link</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">Hi {first}, here&apos;s what we need from you</h1>
            <p className="m-0 text-[15.5px] leading-7 text-white/70">
              Upload each document below. A PDF, a photo from your phone or a spreadsheet is fine. Only {businessName} can see what you send.
            </p>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5" aria-label="Progress">
            <div className="flex items-baseline justify-between">
              <span className="text-[22px] font-semibold">
                {sent + na.length} <span className="text-[15px] font-normal text-white/50">of {total}</span>
              </span>
              <span className="text-[13px] text-white/60">
                {todo} {todo === 1 ? "document" : "documents"} to go &middot; {pct}%
              </span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${sent} sent, ${na.length} not applicable, ${todo} to upload`}>
              <i className="bg-[#3DDC97]" style={{ width: seg(sent) }} />
              <i className="bg-white/40" style={{ width: seg(na.length) }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-white/60">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-[#3DDC97]" />
                Sent {sent}
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-white/40" />
                Not applicable {na.length}
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-white/10 ring-1 ring-white/30" />
                To upload {todo}
              </span>
            </div>
          </section>

          <section aria-label="Your checklist" className="flex flex-col gap-2">
            <h2 className={EYEBROW}>Your checklist</h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {items.map(({ item, n }) => {
                const s =
                  item.status === "NOT_APPLICABLE" ? "N/A" : item.status === "REQUESTED" ? (item.rejectReason ? "Send again" : "To upload") : item.status === "ACCEPTED" ? "Accepted" : "Sent";
                const tone = s === "Sent" || s === "Accepted" ? "text-[#7FF0BD]" : s === "Send again" ? "text-[#FF9BB0]" : "text-white/45";
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 border-b border-white/[0.07] py-2.5 text-[14px] last:border-0">
                    <span className="flex min-w-0 gap-3">
                      <span className="font-mono text-[12px] text-white/35">{n}</span>
                      <span className="truncate text-white/85">{item.label}</span>
                    </span>
                    <span className={`flex-none text-[12.5px] ${tone}`}>{s}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-label="Photo tips">
            <h2 className="m-0 text-[15px] font-medium">Taking photos? A few tips</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {TIPS.map((t, i) => (
                <li key={t} className="flex gap-3 text-[13.5px] leading-6 text-white/65">
                  <span className="font-mono text-[12px] text-[#5CC8FF]">{String(i + 1).padStart(2, "0")}</span>
                  {t}
                </li>
              ))}
            </ol>
          </section>

          <p className="m-0 text-[13px] leading-6 text-white/45">
            Questions? Reply to the email {businessName} sent you.
            <br />
            Private to you. Please don&apos;t share this link.
          </p>
        </aside>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4" aria-label="Still needed">
            <div className="flex items-center justify-between">
              <h2 className={EYEBROW}>
                Still needed <span className={COUNT}>{active.length}</span>
              </h2>
              <span className="text-[12.5px] text-white/45">Saved as you go</span>
            </div>
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
              {active.map(({ item, n }) => {
                const hint = docHint(item.label);
                return (
                  <li key={item.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex gap-3">
                      <span className="font-mono text-[12px] text-white/35">{n}</span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="m-0 text-[16px] font-medium leading-snug">{item.label}</h3>
                        {hint && <p className="m-0 text-[13px] text-white/50">{hint}</p>}
                        {item.rejectReason && <p className="m-0 text-[13px] text-[#FF9BB0]">Please send again: {item.rejectReason}</p>}
                      </div>
                    </div>
                    <DropZone token={token} clientId={client.id} itemId={item.id} label={item.label} fileName={item.status === "REQUESTED" ? null : item.fileName} accepted={item.status === "ACCEPTED"} />
                    {item.status !== "ACCEPTED" && <ItemActions token={token} itemId={item.id} label={item.label} status={item.status} />}
                  </li>
                );
              })}
            </ul>
          </section>

          {na.length > 0 && (
            <section className="flex flex-col gap-3" aria-label="Not applicable">
              <h2 className={EYEBROW}>
                Done <span className={COUNT}>{na.length}</span>
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {na.map(({ item, n }) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[14.5px] text-white/80">
                        <span className="mr-3 font-mono text-[12px] text-white/35">{n}</span>
                        {item.label}
                      </span>
                      <span className="text-[12.5px] text-white/45">Not applicable{item.clientNote ? `: "${item.clientNote}"` : ""}</span>
                    </span>
                    <ItemActions token={token} itemId={item.id} label={item.label} status={item.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="m-0 text-[13px] leading-6 text-white/45">
            Sent something by mistake? Use Replace, or reply to the email. Your files are stored privately in the UK and only {businessName} can open them. They are deleted from this service automatically{" "}
            {FILE_RETENTION_DAYS} days after you upload them. Zenith Studio runs this page for {businessName}; see our{" "}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
