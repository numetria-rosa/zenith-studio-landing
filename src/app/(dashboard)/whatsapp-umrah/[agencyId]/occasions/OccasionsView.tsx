"use client";

import { useState, useTransition } from "react";
import { WaIcon } from "@/components/wa/Icon";
import { ConfirmAction } from "@/components/wa/ConfirmDialog";
import { Card, FieldLabel, GhostButton, GlassButton, Hint, Input, PrimaryButton, Segmented } from "@/components/wa/ui";
import { cx } from "@/components/wa/tokens";

type Item = { id: string; name: string; start: string; end: string; label: string; remove: () => Promise<void> };
type Form = { name: string; mode: "day" | "range"; start: string; end: string };

const EMPTY: Form = { name: "", mode: "range", start: "", end: "" };
const DATE = "[color-scheme:dark]";

/** The agency's occasions calendar: a list on the left, an add / edit form on the right. */
export function OccasionsView({ items, agentName, save, addSuggested }: { items: Item[]; agentName: string; save: (occasionId: string | null, formData: FormData) => Promise<void>; addSuggested: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
  };
  const edit = (o: Item) => {
    setEditing(o.id);
    setForm({ name: o.name, mode: o.end ? "range" : "day", start: o.start, end: o.end });
    setError(null);
  };
  const submit = () => {
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("startDate", form.start);
    fd.set("endDate", form.mode === "range" ? form.end : "");
    start(async () => {
      try {
        await save(editing, fd);
        reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn't save. Try again.");
      }
    });
  };

  return (
    <div className="grid items-start gap-[22px]" style={{ gridTemplateColumns: "minmax(0, 1fr) 360px" }}>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-[18px]">
          <span className="font-mono text-[11.5px] uppercase tracking-[.16em] text-dim">
            {items.length} {items.length === 1 ? "occasion" : "occasions"}
          </span>
          <span className="text-[13px] text-dim">Your dates win. {agentName} never states an occasion that isn&apos;t here.</span>
        </div>
        {items.length === 0 && (
          <div className="border-t border-[rgba(255,255,255,.06)] px-[22px] py-8 text-center">
            <div className="text-[14px] text-dim">No occasions yet. Add one on the right, or start from the usual 2027 dates.</div>
            <GlassButton className="mt-4" icon="calendar" disabled={pending} onClick={() => start(addSuggested)}>
              Add Ramadan, Eid and Hajj 2027
            </GlassButton>
            <Hint className="mt-3">Approximate: moon sighting can move them by a day or two. Check each against the announcement and edit it.</Hint>
          </div>
        )}
        {items.map((o) => (
          <div key={o.id} className={cx("flex items-center gap-4 border-t border-[rgba(255,255,255,.06)] px-[22px] py-4", editing === o.id && "bg-[rgba(255,255,255,.03)]")}>
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[rgba(92,200,255,.10)]">
              <WaIcon name="calendar" size={18} stroke="#5CC8FF" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] text-frost">{o.name}</div>
              <div className="font-mono text-[12.5px] text-mist">{o.label}</div>
            </div>
            <GhostButton icon="edit" onClick={() => edit(o)}>
              Edit
            </GhostButton>
            <ConfirmAction
              action={async () => {
                await o.remove();
                if (editing === o.id) reset();
              }}
              title={`Remove ${o.name}?`}
              description={`${agentName} will stop matching customers to this occasion straight away.`}
              confirmLabel="Remove"
              trigger={
                <GhostButton icon="trash" className="!text-ember-text">
                  Remove
                </GhostButton>
              }
            />
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <div className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">{editing ? "Edit occasion" : "Add an occasion"}</div>
        <div className="flex flex-col gap-[16px]">
          <div>
            <FieldLabel htmlFor="occ-name">Name</FieldLabel>
            <Input id="occ-name" value={form.name} maxLength={60} placeholder="e.g. Ramadan 2027" onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <FieldLabel>When</FieldLabel>
            <Segmented label="One day or a range" size="sm" value={form.mode} onChange={(v) => set({ mode: v })} options={[{ value: "day", label: "One day" }, { value: "range", label: "Date range" }]} />
          </div>
          <div className={cx("grid gap-3", form.mode === "range" && "grid-cols-2")}>
            <div>
              <FieldLabel htmlFor="occ-start">{form.mode === "range" ? "First day" : "Date"}</FieldLabel>
              <Input id="occ-start" type="date" value={form.start} className={DATE} onChange={(e) => set({ start: e.target.value })} />
            </div>
            {form.mode === "range" && (
              <div>
                <FieldLabel htmlFor="occ-end">Last day</FieldLabel>
                <Input id="occ-end" type="date" value={form.end} min={form.start || undefined} className={DATE} onChange={(e) => set({ end: e.target.value })} />
              </div>
            )}
          </div>
          {error && (
            <div role="alert" className="text-[13px] text-ember-text">
              {error}
            </div>
          )}
          <div className="flex gap-[10px]">
            <PrimaryButton disabled={pending} onClick={submit}>
              <WaIcon name="check" size={16} stroke="#05060A" strokeWidth={2.4} />
              {pending ? "Saving..." : editing ? "Save changes" : "Add occasion"}
            </PrimaryButton>
            {editing && <GlassButton onClick={reset}>Cancel</GlassButton>}
          </div>
          <Hint>Anything you sell around works: school half-terms, Eid, a summer break. For a single day, pick &ldquo;One day&rdquo;.</Hint>
        </div>
      </Card>
    </div>
  );
}
