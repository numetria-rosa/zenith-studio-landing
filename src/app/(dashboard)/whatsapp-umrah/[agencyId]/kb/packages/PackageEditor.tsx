"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { STEPS, draftToFormEntries, firstProblem, stepStates, type PackageDraft } from "@/lib/whatsapp-umrah/kb/package-form";
import { WaIcon } from "@/components/wa/Icon";
import { ConfirmDialog } from "@/components/wa/ConfirmDialog";
import { Card, GlassButton, Hint, PageHeader, PrimaryButton } from "@/components/wa/ui";
import { cx } from "@/components/wa/tokens";
import { BasicsStep, ExtrasStep, IncludedStep, PriceStep, StayStep, TravelStep } from "./PackageSteps";
import { PackageRail } from "./PackageRail";
import { useT } from "@/components/wa/i18n";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";
const PANELS = [BasicsStep, StayStep, PriceStep, TravelStep, IncludedStep, ExtrasStep];

/**
 * The add / edit package form: six steps in one card, a live rail on the right. It edits a PackageDraft and posts
 * the same fields savePackageAction already parses. Leaving with unsaved changes asks first.
 */
export function PackageEditor({ base, mode, savedName, initial, agentName, agencyName, save }: { base: string; mode: "new" | "edit"; savedName: string; initial: PackageDraft; agentName: string; agencyName: string; save: (formData: FormData) => Promise<void> }) {
  const t = useT();
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [initialJson] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(d) !== initialJson;
  const guard = useRef(false); // read by the leave handlers below, which live outside React's render
  useEffect(() => {
    guard.current = dirty && !saving;
  }, [dirty, saving]);

  const set = (patch: Partial<PackageDraft>) => setD((prev) => ({ ...prev, ...patch }));
  const kbHref = `${base}/kb`;

  // Leaving with unsaved changes: the browser asks on reload / close, and in-app links open our own confirm.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!guard.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (!guard.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== window.location.origin || a.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(a.pathname + a.search);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const submit = () => {
    const problem = firstProblem(d);
    if (problem) {
      setStep(problem.step);
      setError(problem.message);
      return;
    }
    setError(null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(draftToFormEntries(d))) fd.set(k, v);
    startSave(async () => {
      await save(fd); // redirects to the package list when it succeeds
    });
  };

  const states = stepStates(d);
  const Panel = PANELS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="leading-[normal]">
      <nav aria-label={t("Breadcrumb")} className="mb-[14px] flex items-center gap-2 text-[13.5px] text-dim">
        <Link href={kbHref} className="text-mist no-underline hover:text-frost">
          {t("Knowledge base")}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`${kbHref}?tab=packages`} className="text-mist no-underline hover:text-frost">
          {t("Packages")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-frost">{mode === "new" ? t("New package") : savedName}</span>
      </nav>
      <PageHeader
        title={mode === "new" ? t("Add a package") : t("Edit package")}
        subtitle={
          <>
            {agentName} {t("quotes these details word for word.")}
            {/* the second sentence only fits on one line (so the page still fits the screen) from 1400px wide */}
            <span className="hidden min-[1400px]:inline"> {t("Fill in as much as you can:")} {agentName} {t("can only answer from what's here.")}</span>
          </>
        }
        actions={
          <>
            <GlassButton href={`${kbHref}?tab=packages`}>{t("Cancel")}</GlassButton>
            <PrimaryButton onClick={submit} disabled={saving}>
              <WaIcon name="check" size={16} stroke="#05060A" strokeWidth={2.4} />
              {saving ? t("Saving...") : t("Save package")}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid items-start gap-[22px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 360px" }}>
        <div className="min-w-0">
          <Card className="flex min-h-[642px] min-w-0 flex-col">
            <div role="tablist" aria-label={t("Package steps")} className="flex items-center border-b border-[rgba(255,255,255,.07)] px-6 py-[18px]">
              {STEPS.map((label, i) => {
                const current = step === i;
                const done = states[i] === true;
                return (
                  <Fragment key={label}>
                    <button type="button" role="tab" aria-selected={current} aria-label={t("Step {n}: {label}", { n: i + 1, label: t(label) })} onClick={() => setStep(i)} className={cx("flex cursor-pointer items-center gap-[9px] whitespace-nowrap border-0 bg-transparent px-1 py-[6px]", FOCUS)}>
                      <span
                        className={cx(
                          "box-border flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[13px] font-mono text-[11.5px] font-semibold",
                          current ? "bg-cyan text-void shadow-[0_0_16px_rgba(92,200,255,.5)]" : done ? "bg-mint text-void" : "border-[1.5px] border-[rgba(255,255,255,.22)] bg-transparent text-mist",
                        )}
                      >
                        {done && !current ? <WaIcon name="check" size={13} stroke="#05060A" strokeWidth={2.8} /> : `0${i + 1}`}
                      </span>
                      {/* below 1400px the card is too narrow for six labels, so only the current step keeps its name */}
                      <span className={cx("text-[14px]", current ? "text-frost" : cx("hidden min-[1400px]:inline", done ? "text-soft" : "text-dim"))}>{t(label)}</span>
                    </button>
                    {i < STEPS.length - 1 && <span aria-hidden="true" className={cx("mx-[10px] h-[1.5px] min-w-[12px] flex-1 rounded-[1px]", done ? "bg-[rgba(61,220,151,.5)]" : "bg-[rgba(255,255,255,.10)]")} />}
                  </Fragment>
                );
              })}
            </div>

            <div className="flex-1">
              <Panel d={d} set={set} agentName={agentName} />
            </div>

            <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,.07)] px-6 py-4">
              {step > 0 && (
                <GlassButton onClick={() => setStep(step - 1)}>
                  <WaIcon name="arrow" size={15} stroke="#C9CCD4" strokeWidth={2} className="rotate-180" />
                  {t("Back")}
                </GlassButton>
              )}
              <span className="flex-1 text-center font-mono text-[12px] text-dim">
                {t("Step")} {step + 1} {t("of")} {STEPS.length}
              </span>
              {last ? (
                <PrimaryButton onClick={submit} disabled={saving}>
                  <WaIcon name="check" size={16} stroke="#05060A" strokeWidth={2.4} />
                  {saving ? t("Saving...") : t("Save package")}
                </PrimaryButton>
              ) : (
                <GlassButton className="!text-frost" onClick={() => setStep(step + 1)}>
                  {t("Next:")} {STEPS[step + 1]}
                  <WaIcon name="arrow" size={15} stroke="#F5F6F8" strokeWidth={2} />
                </GlassButton>
              )}
            </div>
          </Card>
          {error ? (
            <div role="alert" className="mt-3 text-center text-[13px] text-ember-text">
              {error}
            </div>
          ) : (
            <Hint className="mt-3 text-center">{t("You can save at any step.")} {agentName} {t("starts using the package as soon as you save.")}</Hint>
          )}
        </div>
        <PackageRail d={d} agentName={agentName} agencyName={agencyName} />
      </div>

      <ConfirmDialog
        open={leaveTo !== null}
        onOpenChange={(o) => !o && setLeaveTo(null)}
        title={t("Leave without saving?")}
        description={t("You have changes to this package that haven't been saved. If you leave now, they're lost.")}
        confirmLabel={t("Leave")}
        onConfirm={() => {
          guard.current = false;
          const to = leaveTo;
          setLeaveTo(null);
          if (to) router.push(to);
        }}
      />
    </div>
  );
}
