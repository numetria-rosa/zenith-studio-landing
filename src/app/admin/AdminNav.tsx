"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FolderKanban,
  CheckSquare,
  LayoutGrid,
  Inbox,
  PhoneCall,
} from "lucide-react";
import type { SearchResult, SearchResultGroup } from "@/lib/admin-search";
import { SEARCH_GROUP_LABELS } from "@/lib/admin-search";

/* Server Components can't pass function/class values (like a lucide-react
   icon component) as props to a Client Component — React serializes props
   across that boundary and functions aren't serializable. So layout.tsx
   (server) passes each nav item's icon as a plain string key, and this
   client component resolves it to the real icon component itself. */
const ICONS = {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FolderKanban,
  CheckSquare,
  LayoutGrid,
  Inbox,
  PhoneCall,
} as const;

export type NavIconName = keyof typeof ICONS;

/* Persistent admin nav — desktop sidebar + mobile drawer + global search
   (Slice 7 of the business command center, 2026-08-28). Client component
   because it needs the current pathname (for highlighting) and interactive
   state (drawer open/closed, search query/results) — matches this
   codebase's existing "use client" pattern for interactive UI
   (src/app/lab/CourseCatalog.tsx). Badge counts are computed server-side in
   layout.tsx and passed in as plain numbers; this component does no data
   fetching of its own except the live search call. */

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  badge?: number;
};

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
            {!!item.badge && item.badge > 0 && (
              <span className="rounded-full bg-red-400/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const grouped: Partial<Record<SearchResultGroup, SearchResult[]>> = {};
  if (results) {
    for (const r of results) {
      if (!grouped[r.group]) grouped[r.group] = [];
      grouped[r.group]!.push(r);
    }
  }

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
    onNavigate?.();
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search clients, proposals, projects..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-white/15 bg-[#0a0b12] p-2 shadow-2xl">
          {loading && <p className="px-3 py-2 text-xs text-white/40">Searching...</p>}
          {!loading && results && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-white/40">No results for &quot;{query.trim()}&quot;.</p>
          )}
          {!loading &&
            (Object.keys(grouped) as SearchResultGroup[]).map((group) => (
              <div key={group} className="mb-1">
                <p className="px-3 pt-2 text-[10px] uppercase tracking-wide text-white/30">
                  {SEARCH_GROUP_LABELS[group]}
                </p>
                {grouped[group]!.map((r) => (
                  <button
                    key={`${group}-${r.id}`}
                    onClick={() => go(r.href)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 transition hover:bg-white/[0.08]"
                  >
                    <span className="block">{r.label}</span>
                    {r.sublabel && <span className="block text-xs text-white/40">{r.sublabel}</span>}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/[0.02] px-4 py-6 md:flex md:flex-col md:gap-6">
        <Link href="/admin" className="px-2 text-sm font-semibold tracking-wide text-white/90">
          Zenith Studio Admin
        </Link>
        <GlobalSearch />
        <NavLinks items={items} pathname={pathname} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
          <Link href="/admin" className="text-sm font-semibold tracking-wide text-white/90">
            Zenith Studio Admin
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg border border-white/15 p-2 text-white/70"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <div className="relative z-50 flex w-72 flex-col gap-6 bg-[#0a0b12] px-4 py-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/90">Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg border border-white/15 p-2 text-white/70"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <GlobalSearch onNavigate={() => setDrawerOpen(false)} />
              <NavLinks items={items} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
