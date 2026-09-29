import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { LEARN_BASE } from "@/components/learn/nav";
import { Icon } from "@/components/obsidian/Icon";
import { ProgressBar } from "@/components/obsidian/ProgressBar";
import { getDoneSteps } from "@/lib/aie/clients";
import { getFinalModule } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";
import { toggleStepAction } from "../actions";

export default async function SellPlanPage() {
  const { userId } = await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/sell-plan`);
  const [mod, done] = await Promise.all([getFinalModule(), getDoneSteps(userId)]);
  const total = mod.sellPlan.length;
  const complete = mod.sellPlan.filter((s) => done.has(s.id)).length;
  const weeks = [...new Set(mod.sellPlan.map((s) => s.week))];

  return (
    <>
      <FinalHeader title="Your 30-day sell plan" lede="Four weeks from the course to a paying client. Tick each step when it is really done; your progress is saved." />

      <div className="glass flex flex-col gap-3 rounded-[22px] p-5" role="group" aria-label="Sell plan progress">
        <div className="flex items-baseline justify-between">
          <b className="text-[20px] font-medium">{complete} of {total} steps done</b>
          <span className="font-mono text-[13px] text-mist">{Math.round((complete / total) * 100)}%</span>
        </div>
        <ProgressBar percent={(complete / total) * 100} color={complete === total ? "#3DDC97" : "#5CC8FF"} label="Sell plan progress" />
      </div>

      {weeks.map((week) => (
        <section key={week} aria-labelledby={`w${week}`} className="flex flex-col gap-3">
          <h2 id={`w${week}`} className="m-0 text-[26px] font-medium tracking-[-0.02em]">Week {week}</h2>
          <ul className="glass m-0 flex list-none flex-col gap-1 rounded-3xl p-2.5">
            {mod.sellPlan.filter((s) => s.week === week).map((s) => {
              const isDone = done.has(s.id);
              return (
                <li key={s.id} className="rounded-[14px]">
                  <form action={toggleStepAction} className="flex items-start gap-4 px-4 py-3.5">
                    <input type="hidden" name="stepId" value={s.id} />
                    <input type="hidden" name="done" value={isDone ? "0" : "1"} />
                    <button
                      type="submit"
                      role="checkbox"
                      aria-checked={isDone}
                      aria-label={`${isDone ? "Mark not done" : "Mark done"}: ${s.title}`}
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                        isDone ? "border-[rgba(61,220,151,0.45)] bg-[rgba(61,220,151,0.14)]" : "border-white/[0.18]"
                      }`}
                    >
                      {isDone && <Icon name="check" size={16} color="#7FF0BD" strokeWidth={2.4} />}
                    </button>
                    <div className="flex flex-col gap-1 pt-2">
                      <b className={`text-[16px] font-medium ${isDone ? "text-mist line-through" : ""}`}>
                        {s.title}
                        <span className="sr-only">{isDone ? " (done)" : " (to do)"}</span>
                      </b>
                      <span className="text-[14.5px] leading-[1.6] text-mist">{s.detail}</span>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
