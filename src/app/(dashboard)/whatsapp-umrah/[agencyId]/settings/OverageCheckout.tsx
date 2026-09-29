"use client";

import { useState } from "react";
import { WhopElements, Checkout, CheckoutElement } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import waStyles from "../waConsole.module.css";

const OVERAGE_PLAN_ID = process.env.NEXT_PUBLIC_WHATSAPP_UMRAH_OVERAGE_PLAN_ID;

/* Embedded checkout for the £5/1,000-extra-replies add-on pack (CLAUDE.md's
   overage section) - stays on this dashboard page instead of redirecting to
   whop.com, per docs.whop.com/developer/guides/embed-checkout. metadata.agencyId
   is what the payment.succeeded webhook (src/app/api/webhooks/whop/route.ts)
   reads to know which agency to credit - onComplete below is display-only,
   fulfillment happens server-side only. */
export function OverageCheckout({ agencyId }: { agencyId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (!OVERAGE_PLAN_ID) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={waStyles.badgeAi}
        style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}
      >
        Buy 1,000 more replies - £5
      </button>
    );
  }

  if (done) {
    return <p style={{ fontSize: 14, color: "var(--zc-done)" }}>Payment received - the extra replies will show up within a minute.</p>;
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <WhopElements elements={loadWhop()}>
        <Checkout
          plan={OVERAGE_PLAN_ID}
          metadata={{ agencyId }}
          onComplete={() => setDone(true)}
        >
          <CheckoutElement />
        </Checkout>
      </WhopElements>
      <button type="button" onClick={() => setOpen(false)} style={{ fontSize: 13, color: "var(--zc-muted)", marginTop: 10 }}>
        Cancel
      </button>
    </div>
  );
}
