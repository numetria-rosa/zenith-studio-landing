import Link from "next/link";
import type { SetupItem } from "@/lib/client-console-data";
import { Icon } from "./Icon";
import { Eyebrow } from "./ui";
import u from "./ui.module.css";
import s from "./setup.module.css";

/* Overview's "Get your team running" card: every tool the plan needs
   connected, in order, each linking straight to the agent screen where
   it's done. Hidden once everything is connected. */
export function SetupChecklist({ items, agentHref }: { items: SetupItem[]; agentHref: (agentId: string) => string }) {
  const doneCount = items.filter((i) => i.done).length;
  const nextIndex = items.findIndex((i) => !i.done);
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <section className={`${u.card} ${s.card}`} data-tour="setup" aria-labelledby="setup-title">
      <div className={s.head}>
        <div>
          <Eyebrow>Get your team running</Eyebrow>
          <h2 id="setup-title" className={s.title}>
            {doneCount === 0 ? "Connect your tools to switch your agents on" : `${items.length - doneCount} step${items.length - doneCount === 1 ? "" : "s"} left`}
          </h2>
        </div>
        <span className={s.count}>
          {doneCount} of {items.length} done
        </span>
      </div>
      <div className={s.bar} aria-hidden>
        <div className={s.barFill} style={{ width: `${pct}%` }} />
      </div>

      <ol className={s.list}>
        {items.map((item, i) => (
          <li key={`${item.agentId}-${item.title}`} className={`${s.row} ${i === nextIndex ? s.rowNext : ""}`}>
            <span className={`${s.mark} ${item.done ? s.markDone : ""}`} aria-hidden>
              {item.done ? <Icon name="check" size={13} strokeWidth={2.6} /> : i + 1}
            </span>
            <div className={s.text}>
              <p className={`${s.rowTitle} ${item.done ? s.rowTitleDone : ""}`}>{item.title}</p>
              {!item.done && <p className={s.rowDetail}>{item.detail}</p>}
            </div>
            {item.done ? (
              <span className={s.doneTag}>Done</span>
            ) : (
              <Link href={agentHref(item.agentId)} className={i === nextIndex ? u.btnPrimary : u.btnGhost}>
                {i === nextIndex ? "Start" : "Set up"}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
