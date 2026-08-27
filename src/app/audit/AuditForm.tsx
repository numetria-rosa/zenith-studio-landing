"use client";

import { useState } from "react";
import Link from "next/link";
import { STEPS } from "./fields";
import { submitAuditRequest } from "./actions";

type Answers = Record<string, string>;

export default function AuditForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [touchedInvalid, setTouchedInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function setValue(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function stepIsValid(): boolean {
    return step.fields
      .filter((f) => f.required)
      .every((f) => (answers[f.key] || "").trim().length > 0);
  }

  function goNext() {
    if (!stepIsValid()) {
      setTouchedInvalid(true);
      return;
    }
    setTouchedInvalid(false);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setTouchedInvalid(false);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    if (!stepIsValid()) {
      setTouchedInvalid(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAuditRequest(answers);
      if (result.ok) {
        setDone(true);
      } else {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError("Something went wrong submitting the form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-8 text-center backdrop-blur-xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-7 w-7 text-emerald-300"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-white">Your audit request is in.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
          We&apos;ll review what you told us and follow up within 2 business days with what we&apos;d recommend.
          We don&apos;t currently send an automatic confirmation email, so keep this page as your confirmation.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-10">
      {/* Progress indicator */}
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

      <div className="mt-7 flex flex-col gap-5">
        {step.fields.map((field) => {
          const value = answers[field.key] || "";
          const invalid = touchedInvalid && field.required && !value.trim();
          const inputId = `audit-${field.key}`;
          return (
            <div key={field.key}>
              <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-white/80">
                {field.label}
                {field.required && <span className="ml-1 text-fuchsia-300">*</span>}
              </label>

              {field.type === "textarea" && (
                <textarea
                  id={inputId}
                  value={value}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-300/50 ${
                    invalid ? "border-fuchsia-400/60" : "border-white/15"
                  }`}
                />
              )}

              {field.type === "select" && (
                <select
                  id={inputId}
                  value={value}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50 ${
                    invalid ? "border-fuchsia-400/60" : "border-white/15"
                  }`}
                >
                  <option value="" className="bg-[#05060a]">
                    Select…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#05060a]">
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {(field.type === "text" || field.type === "email" || field.type === "tel") && (
                <input
                  id={inputId}
                  type={field.type}
                  value={value}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-300/50 ${
                    invalid ? "border-fuchsia-400/60" : "border-white/15"
                  }`}
                />
              )}

              {invalid && <p className="mt-1 text-xs text-fuchsia-300">This field is required.</p>}
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
          onClick={goBack}
          disabled={stepIndex === 0}
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
            {submitting ? "Submitting…" : "Submit audit request"}
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
