import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { StatStrip } from "@/components/obsidian/StatStrip";
import { numberedModules, totalHours, type CourseDetails } from "./data";
import { PriceLockup, type Price } from "./PriceLockup";

export function Hero({ details, checkoutHref, ctaLabel, price }: { details: CourseDetails; checkoutHref: string; ctaLabel: string; price: Price | null }) {
  const modules = numberedModules(details);
  const stack = [...modules].reverse();
  const capstoneNumber = details.capstone ? modules[modules.length - 1].number : null;
  const longest = Math.max(90, ...modules.map((m) => m.minutes ?? 0));
  const hours = totalHours(details);
  const [first, ...rest] = details.title.split(" ");
  const second = rest.join(" ");

  return (
    <section id="overview" className="relative overflow-hidden bg-void">
      <div className="relative mx-auto min-h-[900px] w-full max-w-[1440px]">
        {/* glows + grid: faded top and bottom so the section melts into its neighbours */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,#000,#000_75%,transparent)]">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[calc(50%-720px-220px)] -top-[160px] h-[1000px] w-[1000px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.34) 0%, rgba(59,107,255,0.10) 40%, rgba(5,6,10,0) 66%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[420px] left-[calc(50%-720px-260px)] h-[800px] w-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(92,200,255,0.12), rgba(5,6,10,0) 62%)" }}
        />
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0" />
        </div>

        {/* content */}
        <div className="relative flex flex-col gap-14 px-5 pb-16 pt-[56px] min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:justify-between min-[1100px]:gap-10 min-[1100px]:px-12 xl:px-20 min-[1100px]:pb-0 min-[1100px]:pt-[178px]">
          <div className="flex w-full flex-col gap-7 min-[1100px]:min-w-0 min-[1100px]:flex-[0_1_640px]">
            <span className="glass inline-flex items-center gap-2.5 self-start rounded-full py-2 pl-3 pr-4 font-mono text-[12.5px] uppercase tracking-[0.14em] text-soft">
              <span className="h-2 w-2 rounded-[4px] bg-violet shadow-[0_0_12px_#8B5CF6]" />
              {details.kicker}
            </span>
            <h1
              className={`m-0 font-medium leading-[0.95] tracking-[-0.055em] ${
                second.length > 14
                  ? "text-[clamp(40px,12vw,56px)] sm:text-[clamp(52px,5.6vw,80px)]"
                  : "text-[clamp(48px,17vw,64px)] sm:text-[clamp(64px,7.78vw,112px)]"
              }`}
            >
              {first}
              {second && (
                <>
                  <br />
                  <span className="bg-[linear-gradient(100deg,#F5F6F8_0%,#C7B0FF_45%,#9BDDFF_100%)] bg-clip-text text-transparent">
                    {second}
                  </span>
                </>
              )}
            </h1>
            <p className="m-0 max-w-[580px] text-[20px] leading-[1.55] text-soft">{details.tagline}</p>
            <div className="flex flex-wrap items-start gap-x-3 gap-y-4">
              <Button href={checkoutHref} arrow>
                {ctaLabel}
              </Button>
              <Button href="#curriculum" variant="glass">
                See the curriculum
              </Button>
              {price && <PriceLockup price={price} className="ml-2 self-center" />}
            </div>
            <StatStrip stats={details.stats} />
          </div>

          {/* stack card */}
          <div
            className="flex w-full flex-col gap-1.5 rounded-[30px] p-[26px] min-[1100px]:mt-[18px] min-[1100px]:min-w-[440px] min-[1100px]:flex-[0_1_594px]"
            style={{
              background: "rgba(12,13,20,0.78)",
              border: "1px solid rgba(199,176,255,0.28)",
              boxShadow: "0 0 80px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 pb-3.5">
              <span className="font-mono text-[13px] uppercase tracking-[0.16em] text-violet-text">
                What you’ll build, bottom up
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-[13px] text-mist">
                <Icon name="clock" size={15} color="#A9AEBA" />
                {hours} total
              </span>
            </div>
            {stack.map((m) => {
              const capstone = m.number === capstoneNumber;
              const width = `${Math.round(((m.minutes ?? 0) / longest) * 100)}%`;
              return (
                <div
                  key={m.number}
                  className={`grid grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-3 rounded-[14px] px-3 sm:grid-cols-[34px_minmax(0,1fr)_72px_44px] sm:gap-3.5 sm:px-4 xl:grid-cols-[34px_minmax(0,1fr)_120px_44px] ${
                    capstone ? "border border-[rgba(61,220,151,0.40)] bg-[rgba(61,220,151,0.08)] py-3.5" : "py-[11px]"
                  }`}
                >
                  <span className="font-mono text-[12px]" style={{ color: capstone ? "#3DDC97" : m.stage.color }}>
                    {String(m.number).padStart(2, "0")}
                  </span>
                  <span className={`text-[14.5px] leading-[1.35] sm:truncate sm:text-[15px] ${capstone ? "text-frost" : "text-soft"}`}>
                    {m.title.replace(": ", " · ")}
                  </span>
                  <span className="hidden h-1.5 overflow-hidden rounded-[3px] bg-white/[0.07] sm:block">
                    <span className="block h-full rounded-[3px]" style={{ width, background: capstone ? "#3DDC97" : m.stage.color }} />
                  </span>
                  <span className="text-right font-mono text-[12px] text-mist">{m.minutes ? `${m.minutes}m` : ""}</span>
                </div>
              );
            })}
            {details.stages[0]?.modules[0]?.number === 0 && (
              <div className="mt-2 flex items-center gap-2.5 border-t border-white/[0.08] px-4 pt-3.5 text-[13.5px] text-mist">
                <span className="h-2 w-2 rounded-[4px] bg-stage-orientation" />
                Starts with Module 0 · {details.stages[0].modules[0].title}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
