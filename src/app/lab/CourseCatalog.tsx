"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { CourseCard, CourseCategory } from "./courses-data";

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
  { id: "blockchain", label: "Blockchain" },
];

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const visible = filter === "all" ? courses : courses.filter((c) => c.category === filter);

  return (
    <div>
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

      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map((course) => {
          const { url, isRealCheckout } = checkoutInfo[course.id] ?? {
            url: waitlistLink,
            isRealCheckout: false,
          };
          const expanded = expandedId === course.id;

          return (
            <div
              key={course.id}
              id={course.id}
              className={`flex flex-col rounded-[30px] border p-7 backdrop-blur-xl transition ${
                course.available
                  ? "border-emerald-300/30 bg-emerald-400/[0.05] shadow-[0_0_50px_rgba(52,211,153,0.08)]"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                  {course.categoryLabel}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    course.available ? "text-emerald-200" : "text-white/40"
                  }`}
                >
                  {course.available ? "Self-paced course" : "Coming soon"}
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{course.name}</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">{course.summary}</p>

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

              {/* Expandable detail */}
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : course.id)}
                aria-expanded={expanded}
                aria-controls={`detail-${course.id}`}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-emerald-200/80 transition hover:text-emerald-100"
              >
                {expanded ? "Show less" : "Explore course"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

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
                {course.price ? (
                  <span className="text-3xl font-semibold tracking-[-0.04em]">{course.price}</span>
                ) : (
                  <span className="text-sm text-white/45">Price to be announced</span>
                )}

                <a
                  href={url}
                  target={isRealCheckout ? "_blank" : undefined}
                  rel={isRealCheckout ? "noopener noreferrer" : undefined}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${
                    course.available
                      ? "bg-white text-black"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {isRealCheckout ? "Get access →" : "Join the waitlist"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
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
