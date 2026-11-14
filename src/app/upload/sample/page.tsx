import UploadLayout from "../[token]/layout";
import { buildDocs } from "../[token]/model";
import { PortalView } from "../[token]/PortalView";

export const metadata = { title: "Preview of the upload page", robots: { index: false, follow: false } };

const FALLBACK = ["Last year's tax return", "Photo ID", "Bank statements"];

/* What a client sees when they open the link in the email, with the accountant's firm name and document list.
   Linked from the "Send me a test email first" email; uploads are switched off (nothing here is saved). */
export default async function SampleUploadPage({ searchParams }: { searchParams: Promise<{ firm?: string; docs?: string }> }) {
  const { firm, docs } = await searchParams;
  const names = (docs ?? "").split("|").map((d) => d.trim().slice(0, 160)).filter(Boolean).slice(0, 8);
  const rows = (names.length ? names : FALLBACK).map((label, i) => ({ id: `sample-${i}`, label, status: "REQUESTED", fileName: null, rejectReason: null, clientNote: null }));
  return (
    <UploadLayout>
      <div className="sticky top-0 z-50 bg-[#5CC8FF] px-4 py-2 text-center text-[13.5px] font-medium text-[#05060A]">Preview: this is the page your client sees. Uploads are switched off here.</div>
      <div className="pointer-events-none select-none" aria-hidden="false">
        <PortalView token="sample" clientId="sample" firm={(firm ?? "").trim().slice(0, 60) || "Your firm"} first="there" docs={buildDocs(rows)} />
      </div>
    </UploadLayout>
  );
}
