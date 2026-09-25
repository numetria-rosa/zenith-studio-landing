"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icon";
import { SERVICE_ORDER, SERVICE_SHORT } from "@/lib/hq";

export function NewClientDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("new") === "1";
  const lastFocus = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  function close() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    router.replace(params.toString() ? `?${params.toString()}` : "?");
  }

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      nameRef.current?.focus();
    } else {
      lastFocus.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="newTitle">
        <div className="dlg-top">
          <b id="newTitle">New client</b>
          <button className="x" type="button" onClick={close} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <form
          className="form"
          action={async (formData) => {
            setPending(true);
            await action(formData);
            setPending(false);
          }}
        >
          <div className="fgrid">
            <div className="fld">
              <label htmlFor="nm">Business name</label>
              <div className="in">
                <input ref={nameRef} id="nm" name="businessName" type="text" autoComplete="off" required />
              </div>
            </div>
            <div className="fld">
              <label htmlFor="ct">Contact name</label>
              <div className="in">
                <input id="ct" name="contactName" type="text" autoComplete="off" />
              </div>
            </div>
            <div className="fld">
              <label htmlFor="em">Contact email</label>
              <div className="in">
                <input id="em" name="contactEmail" type="email" autoComplete="off" required />
              </div>
            </div>
            <div className="fld">
              <label htmlFor="sv">Service</label>
              <div className="in">
                <select id="sv" name="serviceSlug" defaultValue={SERVICE_ORDER[0]}>
                  {SERVICE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {SERVICE_SHORT[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fld">
              <label htmlFor="bl">Billing</label>
              <div className="in">
                <select id="bl" name="billingCycle" defaultValue="monthly">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            Adding a client starts the setup clock and shows the ready time on their dashboard.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn" type="button" onClick={close}>
              Cancel
            </button>
            <button className="btn go" type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
