import { Icon, type IconName } from "@/components/obsidian/Icon";
import { SectionHead } from "@/components/obsidian/SectionHead";
import { courseContent, totalPages } from "./data";

export function Inside() {
  return (
    <section id="inside" className="relative overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[300px] -top-[300px] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,107,255,0.20), rgba(5,6,10,0) 62%)" }}
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-14 px-5 py-24 lg:px-20">
        <SectionHead
          eyebrow="Inside the course"
          title={`${courseContent.appSections.length} sections, ${totalPages} real pages.`}
          intro="The course is an app, not a video playlist. Every page has one job, from where you left off to proof you can show."
        />
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courseContent.appSections.map((section) => (
            <div key={section.name} className="glass flex min-w-0 flex-col gap-4 rounded-[26px] p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="m-0 text-[28px] font-medium tracking-[-0.03em]">{section.name}</h3>
                <span
                  className="font-mono text-[12px] uppercase tracking-[0.12em]"
                  style={{ color: section.color }}
                >
                  {section.pages.length} {section.pages.length === 1 ? "page" : "pages"}
                </span>
              </div>
              <p className="m-0 mb-1.5 min-h-[45px] text-[14.5px] leading-[1.55] text-mist">{section.description}</p>
              {section.pages.map((page) => (
                <div key={page.name} className="glass-row flex items-start gap-3.5 rounded-2xl p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-white/[0.12] bg-white/[0.05]">
                    <Icon name={page.icon as IconName} size={18} color={section.color} />
                  </span>
                  <div className="flex flex-col gap-[3px]">
                    <b className="text-[16px] font-medium">{page.name}</b>
                    <span className="text-[14px] leading-[1.5] text-mist">{page.description}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
