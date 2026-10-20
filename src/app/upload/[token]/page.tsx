import { notFound } from "next/navigation";
import { getUploadPortal } from "@/lib/document-chaser-db";
import { UploadButton } from "./UploadButton";

export const metadata = { title: "Upload your documents", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* The private page a client opens from their accountant's email: what's still needed, one upload button
   each, no account. Files go to private storage that only the accountant can open. */
export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await getUploadPortal(token);
  if (!portal) notFound();
  const { client, businessName } = portal;
  const first = client.name.trim().split(/\s+/)[0];
  const done = client.items.filter((i) => i.status !== "REQUESTED").length;
  const total = client.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#05060a] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-white/50">{businessName}</p>
          <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">Hi {first}, here&apos;s what we need from you</h1>
          <p className="m-0 text-[15.5px] leading-7 text-white/70">
            Upload each document below. A PDF, a photo from your phone, or a spreadsheet is fine. Only {businessName} can see what you send.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex justify-between text-[13.5px] text-white/60">
              <span>
                {done} of {total} sent
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10" role="img" aria-label={`${done} of ${total} documents sent`}>
              <div className="h-full rounded-full bg-[#3DDC97]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </header>

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {client.items.map((item) => {
            const state = item.status === "ACCEPTED" ? "Accepted" : item.status === "RECEIVED" ? "Received, being checked" : item.rejectReason ? "Please send again" : "Needed";
            const tone = item.status === "ACCEPTED" || item.status === "RECEIVED" ? "text-[#7FF0BD]" : item.rejectReason ? "text-[#FF9BB0]" : "text-white/60";
            return (
              <li key={item.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[16px] font-medium">{item.label}</span>
                  <span className={`text-[13.5px] ${tone}`}>
                    {state}
                    {item.rejectReason ? `: ${item.rejectReason}` : ""}
                    {item.fileName && item.status !== "REQUESTED" ? ` · ${item.fileName}` : ""}
                  </span>
                </div>
                {item.status !== "ACCEPTED" && <UploadButton token={token} clientId={client.id} itemId={item.id} label={item.label} replace={item.status === "RECEIVED"} />}
              </li>
            );
          })}
        </ul>

        <p className="m-0 text-[13px] leading-6 text-white/45">
          Questions? Reply to the email {businessName} sent you. This page is private to you; please don&apos;t share the link.
        </p>
      </div>
    </main>
  );
}
