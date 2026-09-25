"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Icon } from "./Icon";

const DATE_LINE = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

export function HqTopbar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onSearchInput(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(value ? `/admin/clients?q=${encodeURIComponent(value)}` : "/admin/clients");
    }, 300);
  }

  return (
    <div className="topbar">
      <div>
        <div className="date">{DATE_LINE}</div>
        <h1 style={{ fontSize: "clamp(28px,3vw,40px)", fontWeight: 600, letterSpacing: "-.03em", marginTop: 6 }}>{title}</h1>
        {subtitle && (
          <p className="muted" style={{ marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="tools">
        {action}
        <label className="sbox">
          <Icon name="search" size={18} color="#7D8392" />
          <input type="search" placeholder="Search clients…" aria-label="Search clients" value={q} onChange={(e) => onSearchInput(e.target.value)} />
        </label>
      </div>
    </div>
  );
}
