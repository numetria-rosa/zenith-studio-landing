"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { STEPS, answerList, type AuditAnswers, type FieldDef } from "./fields";
import { submitAuditRequest } from "./actions";

type Outcome = { proposalSent: boolean; email: string };

function isFilled(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value && value.trim());
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function OptionGroup({
  field,
  value,
  invalid,
  onPick,
}: {
  field: FieldDef;
  value: string | string[] | undefined;
  invalid: boolean;
  onPick: (opt: string) => void;
}) {
  const multi = field.type === "multi";
  const selected = new Set(answerList(value));
  const compact = field.options!.every((o) => o.length <= 16);

  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={field.label}
      className={`${compact ? "flex flex-wrap gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"} ${
        invalid ? "rounded-2xl ring-1 ring-fuchsia-400/50 ring-offset-4 ring-offset-transparent" : ""
      }`}
    >
      {field.options!.map((opt) => {
        const on = selected.has(opt);
        return (
          <button
            key={opt}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onPick(opt)}
            className={`group flex items-center gap-2.5 border text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
              compact ? "rounded-full px-4 py-2" : "rounded-xl px-4 py-3"
            } ${
              on
                ? "border-cyan-300/60 bg-cyan-400/[0.12] text-white shadow-[0_0_24px_-8px_rgba(103,232,249,0.6)]"
                : "border-white/12 bg-white/[0.03] text-white/70 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {!compact && (
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border transition ${multi ? "rounded-md" : "rounded-full"} ${
                  on ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/25 group-hover:border-white/50"
                }`}
              >
                {on && <CheckIcon className="h-3.5 w-3.5" />}
              </span>
            )}
            {compact && on && <CheckIcon className="h-3.5 w-3.5 text-cyan-300" />}
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function AuditForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AuditAnswers>({});
  const [touchedInvalid, setTouchedInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function setValue(key: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  // Functional update so rapid taps each build on the latest selection.
  function pick(field: FieldDef, opt: string) {
    if (field.type !== "multi") return setValue(field.key, opt);
    setAnswers((prev) => {
      const next = new Set(answerList(prev[field.key]));
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return { ...prev, [field.key]: field.options!.filter((o) => next.has(o)) };
    });
  }

  function stepIsValid(): boolean {
    return step.fields.filter((f) => f.required).every((f) => isFilled(answers[f.key]));
  }

  function moveTo(i: number) {
    setTouchedInvalid(false);
    setStepIndex(i);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goNext() {
    if (!stepIsValid()) return setTouchedInvalid(true);
    moveTo(Math.min(stepIndex + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    if (!stepIsValid()) return setTouchedInvalid(true);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAuditRequest(answers);
      if (result.ok) setOutcome({ proposalSent: result.proposalSent, email: result.email });
      else setSubmitError(result.error);
    } catch {
      setSubmitError("Something went wrong submitting the form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (outcome) {
    return (
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-8 text-center backdrop-blur-xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
          <CheckIcon className="h-7 w-7 text-emerald-300" />
        </div>
        {outcome.proposalSent ? (
          <>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-white">Your proposal is on its way.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
              We matched your answers to the right services and emailed a personalized proposal with pricing to{" "}
              <span className="font-medium text-white">{outcome.email}</span>. It usually arrives within a minute. If
              you don&apos;t see it, check your spam or promotions folder.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
              The email has a link where you can review everything and approve it when you&apos;re ready.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-white">Your audit request is in.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
              Your answers need a closer look before we recommend the right setup, so a person on our team will review
              them and email <span className="font-medium text-white">{outcome.email}</span> within 2 business days.
            </p>
          </>
        )}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-10">
      <div className="flex items-center gap-2" role="list" aria-label="Form progress">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center gap-2" role="listitem">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-gradient-to-r from-cyan-300 to-fuchsia-300" : "bg-white/10"
              }`}
              aria-hidden
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <span>
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <span className="uppercase tracking-[0.2em]">{step.title}</span>
      </div>

      <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">{step.title}</h2>
      <p className="mt-1.5 text-sm text-white/55">{step.description}</p>

      <div className="mt-7 flex flex-col gap-7">
        {step.fields.map((field) => {
          const value = answers[field.key];
          const invalid = touchedInvalid && Boolean(field.required) && !isFilled(value);
          const inputId = `audit-${field.key}`;
          const inputClass = `w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-300/50 ${
            invalid ? "border-fuchsia-400/60" : "border-white/15"
          }`;
          return (
            <div key={field.key}>
              <label htmlFor={field.options ? undefined : inputId} className="mb-2 block text-sm font-medium text-white/85">
                {field.label}
                {field.required && <span className="ml-1 text-fuchsia-300">*</span>}
                {field.type === "multi" && <span className="ml-2 text-xs font-normal text-white/40">Pick all that apply</span>}
              </label>

              {field.options && (
                <OptionGroup field={field} value={value} invalid={invalid} onPick={(opt) => pick(field, opt)} />
              )}

              {field.type === "textarea" && (
                <textarea
                  id={inputId}
                  value={(value as string) || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={inputClass}
                />
              )}

              {(field.type === "text" || field.type === "email" || field.type === "tel") && (
                <input
                  id={inputId}
                  type={field.type}
                  value={(value as string) || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}

              {invalid && (
                <p className="mt-1.5 text-xs text-fuchsia-300">
                  {field.options ? "Please choose an option." : "This field is required."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {submitError && (
        <p className="mt-5 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-3 text-sm text-fuchsia-200">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveTo(Math.max(stepIndex - 1, 0))}
          disabled={stepIndex === 0 || submitting}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? "Building your proposal…" : "Get my proposal"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
