"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import type { AttentionItem } from "@/lib/hq";

const SEVERITY_CLASS: Record<AttentionItem["severity"], string> = { red: "red", amber: "amber", cyan: "cy" };

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, 6);

  return (
    <section className="card pad" id="queue">
      <div className="ctop">
        <h2>Needs your attention</h2>
        <span className="muted">{items.length} items</span>
      </div>
      <div className="q">
        {items.length === 0 && (
          <div className="empty">
            <b>All clear</b>Nothing needs you right now.
          </div>
        )}
        {shown.map((item, i) => (
          <div className={`qi ${SEVERITY_CLASS[item.severity]}`} key={i}>
            <span className="qic">
              <Icon name={item.icon} size={18} />
            </span>
            <div className="tx">
              <b>{item.title}</b>
              <span>{item.subtitle}</span>
            </div>
            <Link href={item.href} className="btn">
              {item.actionLabel}
            </Link>
          </div>
        ))}
      </div>
      {items.length > 6 && (
        <button className="link" type="button" style={{ marginTop: 12 }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </section>
  );
}
