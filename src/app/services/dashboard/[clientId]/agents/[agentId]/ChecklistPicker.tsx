"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../../Icon";
import c from "./chaser.module.css";

export type PickerOption = { key: string; name: string; title?: string; sub?: string; group: string; items: string[] };

const GROUPS: [string, string][] = [
  ["Yours", "Your checklists"],
  ["US", "United States"],
  ["UK", "United Kingdom"],
  ["Any", "Any country"],
];

/* The default-checklist picker: a searchable list grouped by country, each checklist with its form codes and
   document count. A listbox button pattern (arrow keys, Enter, Escape), since the browser's own <select> can't
   show any of that. */
export function ChecklistPicker({
  options,
  value,
  onChange,
  onCreate,
  current,
  compact,
  label = "Checklist",
}: {
  options: PickerOption[];
  value: string;
  onChange: (key: string) => void;
  /** Shows "Create a custom checklist" at the bottom when given. */
  onCreate?: () => void;
  /** What the closed button shows: the chosen list, or a custom one being built. */
  current: { title: string; sub?: string; group?: string; badge: string };
  /** The smaller button used on each client's card. */
  compact?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const shown = GROUPS.map(([g, label]) => ({
    g,
    label,
    opts: options.filter((o) => o.group === g && (!q || `${o.title ?? o.name} ${o.sub ?? ""} ${o.name}`.toLowerCase().includes(q))),
  })).filter((x) => x.opts.length);
  const flat = shown.flatMap((x) => x.opts);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function openList() {
    setQuery("");
    // Highlight the chosen list, counted in the order the list shows (grouped), not the order passed in.
    const ordered = GROUPS.flatMap(([g]) => options.filter((o) => o.group === g));
    setActive(Math.max(0, ordered.findIndex((o) => o.key === value)));
    setOpen(true);
  }
  function choose(key: string) {
    onChange(key);
    setOpen(false);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + (e.key === "ArrowDown" ? 1 : -1) + flat.length) % flat.length : 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) choose(flat[active].key);
    }
  }

  return (
    <div className={c.picker} ref={root}>
      <button
        type="button"
        className={`${c.pickerButton} ${compact ? c.pickerCompact : ""} ${open ? c.pickerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.title}`}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <Icon name="file" size={18} />
        <span className={c.pickerTitle}>
          {current.title}
          {current.sub && <small>{current.sub}</small>}
        </span>
        {current.group && <Region group={current.group} />}
        <span className={c.badge}>{current.badge}</span>
        <span className={open ? c.chevUp : undefined}>
          <Icon name="chevronDown" size={18} />
        </span>
      </button>

      {open && (
        <div className={c.pickerPanel} onKeyDown={onKey}>
          <div className={c.pickerSearch}>
            <Icon name="search" size={17} />
            <input
              ref={search}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Search checklists"
              aria-label="Search checklists"
              aria-controls={listId}
              aria-activedescendant={flat[active] ? `${listId}-${flat[active].key}` : undefined}
            />
          </div>
          <div className={c.pickerList} id={listId} role="listbox" aria-label="Checklists">
            {shown.map(({ g, label, opts }) => (
              <div key={g} role="group" aria-label={label}>
                <div className={c.pickerGroup}>
                  <Region group={g} />
                  <span>{label}</span>
                </div>
                {opts.map((o) => {
                  const selected = o.key === value;
                  const i = flat.indexOf(o);
                  return (
                    <div
                      key={o.key}
                      id={`${listId}-${o.key}`}
                      role="option"
                      aria-selected={selected}
                      className={`${c.pickerItem} ${selected ? c.pickerSelected : ""} ${i === active ? c.pickerActive : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(o.key)}
                    >
                      <span className={c.pickerCheck}>{selected && <Icon name="check" size={16} strokeWidth={2.4} />}</span>
                      <span className={c.pickerName}>
                        {o.title ?? o.name}
                        {o.sub && <small>{o.sub}</small>}
                      </span>
                      <span className={c.pickerCount}>{o.items.length} docs</span>
                    </div>
                  );
                })}
              </div>
            ))}
            {!flat.length && <p className={c.pickerEmpty}>No checklist matches &ldquo;{query}&rdquo;.</p>}
          </div>
          {onCreate && (
            <button
              type="button"
              className={c.pickerCreate}
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              <Icon name="plus" size={16} /> Create a custom checklist
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Region({ group }: { group: string }) {
  if (group === "US" || group === "UK") return <span className={c.region}>{group}</span>;
  if (group === "Yours") return <Icon name="userCheck" size={15} />;
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  );
}
