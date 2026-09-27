"use client";

import { Icon } from "./Icon";
import { useAskTeam } from "./AskYourTeam";
import s from "./overview.module.css";

export function HeaderActions() {
  const { open } = useAskTeam();
  return (
    <div className={s.headerActions}>
      <button type="button" className={s.searchBtn} onClick={() => open()} data-tour="ask">
        <Icon name="search" size={18} />
        Ask your team anything...
      </button>
      <button type="button" className={s.bellBtn} aria-label="What needs me right now?" onClick={() => open("What needs me right now?")}>
        <Icon name="bell" size={20} />
        <span className={s.bellDot} />
      </button>
    </div>
  );
}
