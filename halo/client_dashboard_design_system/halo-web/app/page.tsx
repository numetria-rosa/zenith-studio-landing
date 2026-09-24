import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TeamMap } from "@/components/TeamMap";
import { Eyebrow } from "@/components/ui";
import { activity, agency, needsYou, stats, type DotTone } from "@/lib/demo-data";
import shell from "@/components/shell.module.css";
import u from "@/components/ui.module.css";
import s from "./home.module.css";

const dotClass: Record<DotTone, string> = {
  live: s.dotLive,
  done: s.dotDone,
  attention: s.dotAttention,
};

export default function TeamHomePage() {
  return (
    <main className={`${shell.main} ${s.main}`}>
      <div className={`${shell.orb} ${shell.orbViolet}`} aria-hidden="true" />

      <header className={s.header}>
        <div className={s.greeting}>
          <h1 className={s.title}>Good morning, {agency.userName}</h1>
          <p className={s.subtitle}>5 agents on shift · 1 item needs you</p>
        </div>
        <div className={s.headerActions}>
          <label className={s.search}>
            <Icon name="search" size={18} />
            <span className="sr-only">Ask your team</span>
            <input type="text" placeholder="Ask your team anything…" className={s.searchInput} />
          </label>
          <button type="button" aria-label="Notifications" className={u.iconButton}>
            <Icon name="bell" size={20} />
            <span className={u.notifyDot} />
          </button>
        </div>
      </header>

      <div className={s.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${s.stat} ${stat.tone === "attention" ? s.statAttention : ""}`}>
            <span className={s.statLabel}>{stat.label}</span>
            <span className={s.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className={s.body}>
        <section className={`dots ${s.mapPanel}`} aria-label="Team map">
          <div className={u.cardHead}>
            <Eyebrow>TEAM MAP</Eyebrow>
            <span className={s.live}>
              <span className={s.liveDot} />
              Live
            </span>
          </div>
          <TeamMap />
        </section>

        <div className={s.side}>
          <Link href={needsYou.href} className={s.needsYou}>
            <span className={s.needsYouTag}>
              <span className={s.needsYouDot} />
              Needs you
            </span>
            <span className={s.needsYouText}>
              <span className={s.needsYouTitle}>{needsYou.title}</span>
              <span className={s.needsYouMeta}>{needsYou.meta}</span>
            </span>
            <span className={s.needsYouCta}>
              Review now
              <Icon name="arrowRight" size={16} strokeWidth={1.8} />
            </span>
          </Link>

          <section className={`${u.listCard} ${s.activity}`} aria-label="Live activity">
            <div className={u.cardHead}>
              <Eyebrow>LIVE ACTIVITY</Eyebrow>
              <a href="#" className={u.textLink}>
                View all
              </a>
            </div>
            {activity.map((item, i) => (
              <Fragment key={item.text}>
                {i > 0 && <div className={s.divider} />}
                <div className={s.item}>
                  <span className={`${s.itemDot} ${dotClass[item.tone]}`} />
                  <div className={s.itemText}>
                    <span className={s.itemTitle}>{item.text}</span>
                    <span className={s.itemMeta}>{item.meta}</span>
                  </div>
                </div>
              </Fragment>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
