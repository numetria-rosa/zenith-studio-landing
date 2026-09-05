export function Objectives({ items = [] }: { items?: string[] }) {
  return (
    <div className="mt-5 rounded-r-xl border border-[#232838] border-l-[3px] border-l-[#4ade95] bg-[#151920] px-6 py-4.5">
      <div className="mb-2.5 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#4ade95]">
        By the end of this module you&apos;ll be able to
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="relative pl-5 text-[14.5px] text-[#eeeee7]">
            <span className="absolute left-0 text-[#8b7cf6]">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
