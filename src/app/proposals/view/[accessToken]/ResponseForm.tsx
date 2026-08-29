"use client";

import { useMemo, useState } from "react";

/* Interactive add-on cart + payment-mode choice + approve/changes/decline,
   for the not-yet-responded state of the client-facing proposal page. A
   client component because the payment-mode question (SPLIT vs BUNDLED)
   only makes sense once a recurring (MONTHLY-kind) amount is actually in
   the approved total, and that depends on which optional add-ons the
   client has ticked — has to react live, not just on submit. The actual
   write (recordClientResponse) still happens server-side via the
   `respond` server action passed in as a prop; this component only owns
   the pre-submit UI state. */

type ItemKind = "SETUP" | "MONTHLY" | "PER_UNIT" | "CUSTOM" | "DISCOUNT";

export type ResponseFormItem = {
  id: string;
  label: string;
  kind: ItemKind;
  amountCents: number;
  unitLabel: string | null;
  isOptionalAddOn: boolean;
};

function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function ResponseForm({
  accessToken,
  items,
  respond,
}: {
  accessToken: string;
  items: ResponseFormItem[];
  respond: (formData: FormData) => void;
}) {
  const coreItems = items.filter((i) => !i.isOptionalAddOn);
  const addOnItems = items.filter((i) => i.isOptionalAddOn);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [paymentMode, setPaymentMode] = useState<"SPLIT" | "BUNDLED">("SPLIT");
  const [changesNote, setChangesNote] = useState("");
  const [declineNote, setDeclineNote] = useState("");

  const totals = useMemo(() => {
    let setupCents = 0;
    let monthlyCents = 0;
    for (const item of coreItems) {
      if (item.kind === "MONTHLY") monthlyCents += item.amountCents;
      else setupCents += item.amountCents;
    }
    for (const item of addOnItems) {
      if (!selectedAddOnIds.has(item.id)) continue;
      if (item.kind === "MONTHLY") monthlyCents += item.amountCents;
      else setupCents += item.amountCents;
    }
    return { setupCents, monthlyCents, totalCents: setupCents + monthlyCents };
  }, [coreItems, addOnItems, selectedAddOnIds]);

  function toggleAddOn(id: string) {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Pricing, now interactive — add-ons have a cart toggle instead of
          just being listed, and the totals below react live. */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-300">Pricing</h2>

        <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
          <span>Item</span>
          <span>Amount</span>
        </div>
        <div className="flex flex-col">
          {coreItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
              <span className="text-white/85">
                {item.label}
                {item.unitLabel ? ` (${item.unitLabel})` : ""}
              </span>
              <span className={`font-semibold ${item.amountCents < 0 ? "text-emerald-400" : "text-white/90"}`}>
                {formatCents(item.amountCents)}
              </span>
            </div>
          ))}
        </div>

        {addOnItems.length > 0 && (
          <>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-fuchsia-300">
              Optional add-ons. Add any you want
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              {addOnItems.map((item) => {
                const selected = selectedAddOnIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAddOn(item.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-fuchsia-400/50 bg-fuchsia-400/[0.08]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                          selected ? "border-fuchsia-300 bg-fuchsia-300 text-black" : "border-white/25 text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="text-white/85">
                        {item.label}
                        {item.unitLabel ? ` (${item.unitLabel})` : ""}
                      </span>
                    </span>
                    <span className="font-semibold text-white/90">{formatCents(item.amountCents)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-sm text-white/60">
          <span>Total without add-ons</span>
          <span>
            {formatCents(
              coreItems.reduce((sum, i) => sum + i.amountCents, 0)
            )}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-base font-semibold">Total with selected add-ons</span>
          <span className="text-2xl font-extrabold text-cyan-300">{formatCents(totals.totalCents)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold">Your response</h2>
        <p className="mt-2 text-sm text-white/50">
          Approve to move forward, request changes with a note, or decline. This records your response.
          We&apos;ll follow up either way.
        </p>

        {totals.monthlyCents > 0 && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/50">How would you like to pay?</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setPaymentMode("SPLIT")}
                className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  paymentMode === "SPLIT" ? "border-cyan-300/60 bg-cyan-400/[0.08]" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <span className="block font-semibold text-white/90">Setup now, monthly once live</span>
                <span className="mt-1 block text-xs text-white/50">
                  Pay {formatCents(totals.setupCents)} today. The {formatCents(totals.monthlyCents)}/mo plan is
                  billed once the work is finished and live.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("BUNDLED")}
                className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  paymentMode === "BUNDLED" ? "border-cyan-300/60 bg-cyan-400/[0.08]" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <span className="block font-semibold text-white/90">Pay both now</span>
                <span className="mt-1 block text-xs text-white/50">
                  One checkout: {formatCents(totals.setupCents)} today, then {formatCents(totals.monthlyCents)}/mo
                  starting from today.
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
          <form action={respond}>
            <input type="hidden" name="accessToken" value={accessToken} />
            <input type="hidden" name="action" value="APPROVED" />
            {Array.from(selectedAddOnIds).map((id) => (
              <input key={id} type="hidden" name="addOnItemId" value={id} />
            ))}
            {totals.monthlyCents > 0 && <input type="hidden" name="paymentMode" value={paymentMode} />}
            <button
              type="submit"
              className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Approve
            </button>
          </form>

          <form action={respond} className="flex flex-1 flex-col gap-2">
            <input type="hidden" name="accessToken" value={accessToken} />
            <input type="hidden" name="action" value="CHANGES_REQUESTED" />
            <textarea
              name="note"
              required
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
              placeholder="What would you like changed?"
              rows={2}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded-full border border-fuchsia-400/40 px-5 py-2.5 text-sm font-semibold text-fuchsia-300 transition hover:border-fuchsia-400/70"
            >
              Request changes
            </button>
          </form>

          <form action={respond} className="flex flex-1 flex-col gap-2">
            <input type="hidden" name="accessToken" value={accessToken} />
            <input type="hidden" name="action" value="REJECTED" />
            <textarea
              name="note"
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder="Reason (optional)"
              rows={2}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/35"
            >
              Decline
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
