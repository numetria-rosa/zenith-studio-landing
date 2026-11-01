import Link from "next/link";
import { FILE_RETENTION_DAYS } from "@/lib/document-chaser";
import { ChecklistRow } from "./ChecklistRow";
import { ProgressSegments } from "./ProgressSegments";
import { GLASS, Icon, MONO, P } from "./ui";
import { needs, partial, stats, type Doc } from "./model";

const TIPS = ["Lay the page flat in good light, all four corners in view.", "One photo per page is fine. Use Add another file for the rest.", "Blurry or cut off? Just hit Replace and send a new one."];

function Help({ firm }: { firm: string }) {
  return (
    <>
      <span className="inline-flex items-center gap-[9px]">
        <Icon d={P.mail} stroke="#7D8392" />
        Questions? Reply to the email {firm} sent you.
      </span>
      <span className="inline-flex items-center gap-[9px]">
        <Icon d={P.lock} stroke="#7D8392" />
        Private to you. Please don&apos;t share this link.
      </span>
      <span className="text-[12.5px] leading-[1.5]">
        Files are stored privately in the UK and deleted {FILE_RETENTION_DAYS} days after upload.{" "}
        <Link href="/privacy" className="text-[#9BDDFF] hover:text-[#C9ECFF]">
          Privacy policy
        </Link>
      </span>
    </>
  );
}

/* The bottom of the page on a phone (on desktop the same lines are pinned to the bottom of the rail). */
export function MobileFooter({ firm }: { firm: string }) {
  return (
    <footer className="mx-5 mt-11 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.07)] pb-10 pt-[22px] text-[14px] text-[#7D8392] lg:hidden">
      <Help firm={firm} />
    </footer>
  );
}

/* The left rail on desktop (sticky, full height, the checklist scrolls inside it); the top of the page on a
   phone, where the checklist and tips are hidden. */
export function Rail({ firm, first, docs }: { firm: string; first: string; docs: Doc[] }) {
  const st = stats(docs);
  return (
    <aside className="relative flex flex-col overflow-hidden px-5 pb-0 pt-7 lg:overflow-y-auto lg:overflow-x-hidden lg:sticky lg:top-0 lg:box-border lg:h-screen lg:w-[470px] lg:flex-shrink-0 lg:border-r lg:border-[rgba(255,255,255,0.07)] lg:bg-[linear-gradient(180deg,rgba(92,200,255,0.05),rgba(5,6,10,0)_40%),#07080D] lg:px-11 lg:pb-10 lg:pt-12">
      <div className="pointer-events-none absolute left-1/2 top-[-420px] h-[800px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(92,200,255,0.13),rgba(5,6,10,0)_62%)] lg:left-[-200px] lg:top-[-260px] lg:h-[700px] lg:translate-x-0 lg:bg-[radial-gradient(circle,rgba(92,200,255,0.16),rgba(5,6,10,0)_62%)]" />
      <header className="relative flex items-center gap-3">
        <div className={`${GLASS} flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[12px] text-[15px] font-semibold`}>{firm.trim().charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{firm}</div>
          <div className={`${MONO} mt-[2px] text-[11.5px] tracking-[0.06em] text-[#7D8392]`}>DOCUMENT REQUEST</div>
        </div>
        <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-[rgba(61,220,151,0.30)] bg-[rgba(61,220,151,0.08)] px-3 py-[6px] text-[13px] text-[#7FF0BD]">
          <Icon d={P.lock} size={14} stroke="#7FF0BD" />
          Private link
        </span>
      </header>
      <h1 className="relative m-0 mt-9 text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] lg:mt-11 lg:text-[42px] lg:leading-[1.06]">Hi {first}, here&apos;s what we need from you</h1>
      <p className="relative m-0 mt-[14px] text-[15.5px] leading-[1.6] text-[#C9CCD4]">Upload each document<span className="lg:hidden"> below</span>. A PDF, a photo from your phone or a spreadsheet is fine. Only {firm} can see what you send.</p>
      <ProgressSegments done={st.done} total={st.total} left={st.left} pct={st.pct} segs={st.segs} />

      <div className={`${MONO} relative mb-2 mt-[30px] hidden text-[12px] uppercase tracking-[0.16em] text-[#7D8392] lg:block`}>Your checklist</div>
      <div className="relative hidden shrink flex-col overflow-y-auto lg:flex lg:min-h-[220px]">
        {docs.map((d) => (
          <ChecklistRow key={d.id} title={d.title} state={d.skip ? "skip" : !needs(d) ? "sent" : partial(d) ? "partial" : "todo"} />
        ))}
      </div>

      <div className="relative mt-7 hidden flex-none rounded-[20px] border border-[rgba(155,221,255,0.18)] bg-[linear-gradient(135deg,rgba(92,200,255,0.07),rgba(139,92,246,0.07))] px-[22px] py-5 lg:block">
        <div className="flex items-center gap-[10px]">
          <Icon d={P.phone} size={17} stroke="#9BDDFF" />
          <span className="text-[15px] font-semibold">Taking photos? A few tips</span>
        </div>
        {TIPS.map((t, i) => (
          <div key={t} className="mt-3 flex gap-3 text-[14px] leading-[1.5] text-[#C9CCD4]">
            <span className={`${MONO} pt-[2px] text-[12px] text-[#9BDDFF]`}>{String(i + 1).padStart(2, "0")}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-auto hidden flex-none flex-col gap-[10px] pt-7 text-[13.5px] text-[#7D8392] lg:flex">
        <Help firm={firm} />
      </div>
    </aside>
  );
}
