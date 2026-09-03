"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Clock,
  Layers,
  ListChecks,
  FolderKanban,
  Trophy,
  Briefcase,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  ShoppingCart,
  Check,
  Database,
  Terminal,
  FileSpreadsheet,
  BarChart3,
  LineChart,
  Workflow,
  Blocks,
  Brain,
  Wrench,
  Palette,
  Timer,
  Shield,
  Bug,
  Cloud,
  Bot,
  Network,
  GitBranch,
  Server,
  KeyRound,
  FileText,
  Search,
  ArrowDownAZ,
  Flame,
  Zap,
} from "lucide-react";
import { fraunces } from "@/lib/fonts";
import type { CourseCard, CourseCategory } from "./courses-data";

/** The exact wordmark used on each course's own static pages' topbar
    (course-rail.js): Fraunces "ZENITH" + a "LAB" badge in that course's own
    accent color (amber for Data Science, neon lime for AI Engineering, and
    so on — straight from each course's real `.logo b` CSS). Placed on each
    catalog card so it visually matches the product the buyer is about to
    land in, not just the /lab marketplace's own emerald theme. */
function ZenithLabWordmark({ color }: { color?: { bg: string; text: string } }) {
  const { bg, text } = color ?? { bg: "#f0b429", text: "#1a1200" };
  return (
    <span className={`${fraunces.className} inline-flex items-center text-xs font-bold tracking-tight text-white/75`}>
      ZENITH
      <span
        className="ml-1 inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[10px] leading-none"
        style={{ background: bg, color: text }}
      >
        LAB
      </span>
    </span>
  );
}

/** Whether a time-limited discount is still active, and its live countdown
    label. /lab is statically prerendered, so this deliberately never uses
    Date.now() during the server render or the client's first hydration
    pass, only inside useEffect (client-only, real wall-clock time): using
    it in the initial render would bake a stale "Xd Xh left" string into
    the static HTML (correct only at build time, wrong for every visitor
    after that) and cause a hydration mismatch the moment the real
    client-side time differs from the frozen build-time value, which it
    always does. "active" is the safe default before mount (matches the
    server-rendered markup exactly), self-correcting to "expired" within
    one tick if a visitor genuinely loads the page after the deadline. */
function useCountdown(deadline: string | undefined): { active: boolean; label: string | null } {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [state, setState] = useState<{ mounted: boolean; msLeft: number | null }>({
    mounted: false,
    msLeft: null,
  });
  const { mounted, msLeft } = state;

  // The lint rule's own suggested fixes (derive state during render, or
  // only setState from an external-system callback) don't apply here:
  // Date.now() can't be called during render without reintroducing the
  // exact server/client hydration mismatch this hook exists to avoid. The
  // "flip a mounted flag on mount, then read real time client-only" idiom
  // is the standard, correct fix for this class of problem.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!target) {
      setState({ mounted: true, msLeft: null });
      return;
    }
    const tick = () => setState({ mounted: true, msLeft: target - Date.now() });
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [target]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!target || !mounted || msLeft === null) return { active: true, label: null };
  if (msLeft <= 0) return { active: false, label: null };

  const days = Math.floor(msLeft / 86_400_000);
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  const label =
    days > 0 ? `${days}d ${hours}h left` : hours > 0 ? `${hours}h ${minutes}m left` : `${Math.max(minutes, 1)}m left`;
  return { active: true, label };
}

const TOPIC_ICONS: Record<string, typeof Database> = {
  SQL: Database,
  Excel: FileSpreadsheet,
  Python: Terminal,
  Statistics: BarChart3,
  Tableau: LineChart,
  "Power BI": LineChart,
  Automation: Workflow,
  "Data Cleaning": Wrench,
  Dashboards: BarChart3,
  "Business Analysis": Briefcase,
  Prompting: Brain,
  Retrieval: Database,
  Agents: Workflow,
  "Tool Use": Wrench,
  "Structured Outputs": ListChecks,
  Evaluation: Check,
  "Cost & Latency": Clock,
  APIs: Blocks,
  "Error Handling": Wrench,
  Queues: Layers,
  Retries: Workflow,
  "Self-Hosting": Terminal,
  Monitoring: LineChart,
  Solidity: Blocks,
  "Contract Security": Wrench,
  Wallets: Briefcase,
  Testing: ListChecks,
  dApps: Palette,
  "AI Orchestration": Bot,
  "AI Pair Programming": Bot,
  "Code Review": ListChecks,
  Debugging: Bug,
  Refactoring: Wrench,
  "Prompt Engineering": Brain,
  "Penetration Testing": Shield,
  "Network Security": Network,
  "Web App Security": Shield,
  "Cloud Security": Cloud,
  "AI/LLM Security": Bot,
  Reporting: FileText,
  "Agent Architectures": Bot,
  Planning: GitBranch,
  "Multi-Agent Systems": Network,
  "Tool Design": Wrench,
  Guardrails: Shield,
  "MCP Protocol": Server,
  "Tool Integration": Blocks,
  "API Design": Blocks,
  "Auth & Scoping": KeyRound,
  Deployment: Server,
};

function TopicIcon({ topic }: { topic: string }) {
  const Icon = TOPIC_ICONS[topic] ?? Blocks;
  return <Icon className="h-3 w-3" aria-hidden />;
}

const FILTERS: { id: CourseCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
  { id: "automation", label: "Automation" },
  { id: "security", label: "Security" },
  { id: "blockchain", label: "Blockchain" },
];

type SortMode = "recommended" | "price-asc" | "tasks-desc";
const SORTS: { id: SortMode; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "tasks-desc", label: "Most hands-on practice" },
];

function parsePrice(price: string | undefined): number {
  if (!price) return Number.POSITIVE_INFINITY;
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function matchesSearch(course: CourseCard, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [course.name, course.categoryLabel, course.hook ?? "", course.summary, ...course.topics]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function CourseCatalog({
  courses,
  checkoutInfo,
  waitlistLink,
}: {
  courses: CourseCard[];
  checkoutInfo: Record<string, { url: string; isRealCheckout: boolean }>;
  waitlistLink: string;
}) {
  const [filter, setFilter] = useState<CourseCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Forward whatever UTM params brought this visitor to /lab into the
  // checkout link, so a sale can actually be traced back to the ad/post
  // that drove it (via /api/go/[courseId], not appended directly — see
  // that route for why: it turns these into real Whop checkout metadata,
  // not just a query string nobody reads).
  const searchParams = useSearchParams();
  const utmQueryString = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [searchParams]);

  const filtered = courses
    .filter((c) => filter === "all" || c.category === filter)
    .filter((c) => matchesSearch(c, search));

  // Availability is always the primary sort key — "Coming soon" courses
  // stay at the bottom no matter what sort is chosen, since sorting a
  // course with no price or task count to the top of "cheapest first"
  // would be a display bug, not a feature. The chosen sort only reorders
  // within each group; "Recommended" leaves the curated catalog order.
  const visible = [...filtered].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    if (sort === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
    if (sort === "tasks-desc") return (b.practiceTasks ?? -1) - (a.practiceTasks ?? -1);
    return 0;
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, tools, topics…"
            aria-label="Search courses"
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 backdrop-blur-xl transition focus:border-emerald-300/40 focus:bg-white/[0.06] focus:outline-none"
          />
        </div>
        <div className="relative sm:ml-auto">
          <ArrowDownAZ className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label="Sort courses"
            className="w-full appearance-none rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-8 text-sm text-white/80 backdrop-blur-xl transition focus:border-emerald-300/40 focus:outline-none sm:w-auto"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0a1410] text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter courses by category"
        className="mb-8 flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === f.id
                ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/85"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/50">
          No courses match &ldquo;{search}&rdquo;. Try a different tool or topic.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map((course) => {
          const { url, isRealCheckout } = checkoutInfo[course.id] ?? {
            url: waitlistLink,
            isRealCheckout: false,
          };
          const trackedUrl = isRealCheckout ? `/api/go/${course.id}${utmQueryString}` : url;
          const expanded = expandedId === course.id;
          // A coarse (non-live-ticking) version of DiscountRibbon's own
          // check, just to know whether to reserve room for it here — the
          // ribbon sits in the same top-right corner as this row's content,
          // and shrinking the ribbon to avoid the badge is fragile (breaks
          // again the next time either one's size changes). Reserving space
          // instead is robust regardless of the ribbon's exact dimensions.
          const discountLive =
            Boolean(course.discountPercent) &&
            Boolean(course.discountDeadline) &&
            Date.parse(course.discountDeadline!) > Date.now();

          return (
            <div
              key={course.id}
              id={course.id}
              className={`group relative flex flex-col overflow-hidden rounded-[30px] border p-7 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 ${
                course.available
                  ? "border-emerald-300/30 bg-emerald-400/[0.05] shadow-[0_0_50px_rgba(52,211,153,0.08)] hover:border-emerald-300/50 hover:shadow-[0_20px_70px_rgba(52,211,153,0.16)]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/20"
              }`}
            >
              {/* Glassmorphism sheen: a soft diagonal highlight sitting above the
                  blurred background, the layered-glass look, not just a blur. */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[30px] opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)",
                }}
                aria-hidden
              />

              <DiscountRibbon course={course} />

              <div
                className={`relative flex items-center justify-between gap-4 ${discountLive ? "pr-11" : ""}`}
              >
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                  {course.categoryLabel}
                </span>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      course.available ? "text-emerald-200" : "text-white/40"
                    }`}
                  >
                    {course.available ? "Self-paced course" : "Coming soon"}
                  </span>
                  <ZenithLabWordmark color={course.labBadgeColor} />
                </div>
              </div>

              <h3 className="relative mt-5 text-2xl font-semibold tracking-[-0.03em]">{course.name}</h3>
              {course.hook && (
                <p className="relative mt-2 flex items-start gap-1.5 text-sm font-medium leading-6 text-emerald-100/90">
                  <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" aria-hidden />
                  {course.hook}
                </p>
              )}
              <p className="relative mt-3 text-sm leading-7 text-white/60">{course.summary}</p>

              {/* Metadata row */}
              <div className="mt-5 flex flex-wrap gap-2">
                <MetaChip icon={Layers} label={course.level} />
                <MetaChip
                  icon={Clock}
                  label={course.weeklyTime ? `${course.duration} · ${course.weeklyTime}` : course.duration}
                />
                {typeof course.practiceTasks === "number" && (
                  <MetaChip icon={ListChecks} label={`${course.practiceTasks} practice tasks`} strong />
                )}
                {typeof course.portfolioProjects === "number" && (
                  <MetaChip icon={FolderKanban} label={`${course.portfolioProjects} portfolio projects`} strong />
                )}
                {course.hasCapstone && <MetaChip icon={Trophy} label="Full capstone project" />}
              </div>

              {/* Topics */}
              {course.topics.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {course.topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65 transition hover:border-white/20 hover:text-white/90"
                    >
                      <TopicIcon topic={topic} />
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* What you'll actually do (first 4, rest behind expand) */}
              <div className="mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  What you&apos;ll actually do
                </div>
                <ul className="mt-2.5 space-y-2">
                  {course.whatYoullDo.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expandable detail + full details page link */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : course.id)}
                  aria-expanded={expanded}
                  aria-controls={`detail-${course.id}`}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-emerald-200/80 transition hover:text-emerald-100"
                >
                  {expanded ? "Show less" : "Explore course"}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                <Link
                  href={`/lab/${course.id}`}
                  className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  Course details
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>

                {isRealCheckout && (
                  <a
                    href={trackedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 self-start rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:scale-[1.02]"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                    Get access
                  </a>
                )}
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={`detail-${course.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-5 border-t border-white/10 pt-5">
                      {course.whatYoullDo.length > 4 && (
                        <ul className="space-y-2">
                          {course.whatYoullDo.slice(4).map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                              <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}

                      {course.facts.length > 0 && (
                        <div className="space-y-2.5">
                          {course.facts.map((fact) => (
                            <div
                              key={fact}
                              className="flex items-start gap-2.5 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] px-4 py-3"
                            >
                              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-300" aria-hidden />
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
                                  Real-world fact
                                </div>
                                <p className="mt-1 text-sm leading-6 text-white/75">{fact}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 rounded-2xl border-l-2 border-emerald-300/60 bg-emerald-400/[0.05] px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
                  <Briefcase className="h-3 w-3" aria-hidden />
                  Career Path Edition
                </div>
                <p className="mt-1.5 text-sm leading-6 text-white/70">{course.careerPath}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <PriceRow course={course} />

                <a
                  href={trackedUrl}
                  target={isRealCheckout ? "_blank" : undefined}
                  rel={isRealCheckout ? "noopener noreferrer" : undefined}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${
                    course.available
                      ? "bg-white text-black"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {isRealCheckout ? (
                    <>
                      <ShoppingCart className="h-4 w-4" aria-hidden />
                      Get access
                    </>
                  ) : (
                    "Join the waitlist"
                  )}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Corner ribbon on the card itself, separate from PriceRow's inline badge —
    a launch discount should be visible scanning the grid, not just after
    reading down to the price. Own component (not inline in the map) so its
    own useCountdown call is hooks-rule-safe per course card. */
function DiscountRibbon({ course }: { course: CourseCard }) {
  const { active: deadlineActive } = useCountdown(course.discountDeadline);
  const discountLive = Boolean(course.discountPercent) && deadlineActive;
  if (!discountLive) return null;

  // A ribbon needs its own small clipped box, not the card's overflow-
  // hidden — relying on the card's rounded corner to clip a diagonal strip
  // whose offset was tuned by eye clipped nearly the whole thing, leaving
  // only a sliver visible. This is the standard corner-ribbon recipe: a
  // fixed square window at the corner, with the rotated strip positioned
  // and sized so its full diagonal actually falls inside that window.
  return (
    <div className="absolute right-0 top-0 z-10 h-14 w-14 overflow-hidden">
      <div className="absolute right-[-24px] top-[10px] flex w-[92px] items-center justify-center gap-1 rotate-45 bg-gradient-to-r from-amber-400 to-orange-400 py-[3px] text-[9px] font-bold uppercase tracking-[0.04em] text-amber-950 shadow-[0_2px_12px_rgba(251,191,36,0.5)]">
        <Flame className="h-2 w-2" aria-hidden />
        {course.discountPercent}% off
      </div>
    </div>
  );
}

function PriceRow({ course }: { course: CourseCard }) {
  const { active: deadlineActive, label: countdown } = useCountdown(course.discountDeadline);
  const discountLive = Boolean(course.discountPercent) && deadlineActive;

  if (!course.price) {
    return <span className="text-sm text-white/45">Price to be announced</span>;
  }

  // Once the deadline passes, the sale is over: show the real list price
  // plain, no strikethrough, no badge, matching what was actually promised.
  const displayPrice = discountLive ? course.price : course.originalPrice ?? course.price;

  // timeZone: "UTC" is required here, not cosmetic: discountDeadline is
  // written in UTC, and formatting it in the viewer's local zone can roll
  // the displayed calendar date forward or back a day depending on their
  // offset (confirmed live: showed "September 1" for a UTC deadline of
  // August 31 23:59:59 in a timezone ahead of UTC). Fixing the displayed
  // date to UTC keeps it exactly what was promised, for every viewer.
  const deadlineLabel = course.discountDeadline
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
        new Date(course.discountDeadline)
      )
    : null;

  return (
    <div className="flex flex-wrap items-baseline gap-2.5">
      <span className="text-3xl font-semibold tracking-[-0.04em]">{displayPrice}</span>
      {discountLive && course.originalPrice && (
        <span className="text-base text-white/40 line-through">{course.originalPrice}</span>
      )}
      {discountLive && typeof course.discountPercent === "number" && (
        <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
          {course.discountPercent}% off{deadlineLabel ? ` until ${deadlineLabel}` : ""}
        </span>
      )}
      {discountLive && countdown && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-200/80">
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {countdown}
        </span>
      )}
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  strong,
}: {
  icon: typeof Clock;
  label: string;
  strong?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
        strong
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-white/10 bg-white/[0.03] text-white/65"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
