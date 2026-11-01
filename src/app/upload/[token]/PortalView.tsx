import { DocCard } from "./DocCard";
import { DoneCard } from "./DoneCard";
import { MobileFooter, Rail } from "./Rail";
import { MONO, Icon, P } from "./ui";
import { needs, stats, type Doc } from "./model";

/* The whole upload page, from plain data (so it can be rendered with sample data too). */
export function PortalView({ token, clientId, firm, first, docs }: { token: string; clientId: string; firm: string; first: string; docs: Doc[] }) {
  const todo = docs.filter(needs);
  const fin = docs.filter((d) => !needs(d));
  const allDone = stats(docs).left === 0;
  return (
    <div className="relative min-h-screen bg-[#05060A] text-[#F5F6F8] lg:flex">
      <Rail firm={firm} first={first} docs={docs} />
      <main className="min-w-0 flex-1 px-5 pt-10 lg:box-border lg:p-12">
        {todo.length > 0 && (
          <div className="mb-[14px] flex items-center gap-3 lg:mb-[18px]">
            <span className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[#5CC8FF]`}>Still needed</span>
            <span className={`${MONO} text-[12px] text-[#7D8392]`}>{todo.length}</span>
            <span className="h-px flex-1 bg-[rgba(255,255,255,0.07)]" />
            <span className="hidden text-[13.5px] text-[#7D8392] lg:inline">Saved as you go</span>
          </div>
        )}
        <div className="flex flex-col gap-[14px] lg:grid lg:grid-cols-[repeat(2,minmax(0,1fr))] lg:gap-4">
          {allDone && (
            <div className="flex items-center gap-4 rounded-[18px] border border-[rgba(61,220,151,0.35)] bg-[rgba(61,220,151,0.08)] px-5 py-[18px] lg:col-span-full lg:rounded-[22px] lg:px-6 lg:py-[22px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#3DDC97] shadow-[0_0_30px_rgba(61,220,151,0.45)] lg:h-11 lg:w-11">
                <Icon d={P.check} size={22} stroke="#05060A" sw={2.4} />
              </span>
              <div className="text-[15px] leading-[1.5] lg:text-[16px]">
                <b className="font-semibold">All done, thank you.</b> <span className="text-[#C9CCD4]">The reminders stop now. {firm} will be in touch if anything needs another look.</span>
              </div>
            </div>
          )}
          {todo.map((d) => (
            <DocCard key={d.id} token={token} clientId={clientId} firm={firm} doc={d} />
          ))}
          {fin.length > 0 && <DoneCard token={token} docs={fin} span={todo.length % 2 === 0} />}
        </div>
      </main>
      <MobileFooter firm={firm} />
    </div>
  );
}
