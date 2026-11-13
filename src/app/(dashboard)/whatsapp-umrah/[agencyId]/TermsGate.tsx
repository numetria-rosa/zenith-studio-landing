"use client";

import { useState, useTransition } from "react";
import { acceptTermsAction } from "./actions";
import { TERMS_ITEMS } from "@/lib/whatsapp-umrah/terms";
import { useT } from "@/components/wa/i18n";

/* Shown instead of the dashboard until the owner has accepted the current terms. */
export function TermsGate({ agencyId }: { agencyId: string }) {
  const t = useT();
  const [ticked, setTicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const all = TERMS_ITEMS.every((i) => ticked.includes(i.id));

  return (
    <form
      className="mx-auto max-w-[640px] rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.04)] p-8"
      action={(fd) => start(async () => { try { await acceptTermsAction(agencyId, fd); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } })}
    >
      <h1 className="text-[22px] font-semibold">{t("Before your agent goes live")}</h1>
      <p className="mt-2 text-[14px] leading-6 text-dim">
        {t("Please confirm each point. We record the date, who accepted and the version.")}{" "}
        <a href="/whatsapp-umrah/dpa" target="_blank" rel="noreferrer" className="underline">{t("Read the full Data Processing Agreement")}</a>.
      </p>
      <ul className="mt-6 space-y-4">
        {TERMS_ITEMS.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-6">
              <input type="checkbox" name="accept" value={i.id} className="mt-[5px] h-4 w-4" checked={ticked.includes(i.id)} onChange={(e) => setTicked((t) => (e.target.checked ? [...t, i.id] : t.filter((x) => x !== i.id)))} />
              <span>{t(i.text)}</span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-4 text-[13px] text-[#FF9BB0]">{error}</p>}
      <button type="submit" disabled={!all || pending} className="mt-6 rounded-full bg-mint px-6 py-3 text-[14px] font-semibold text-void disabled:opacity-40">
        {pending ? t("Saving...") : t("Accept and continue")}
      </button>
    </form>
  );
}
