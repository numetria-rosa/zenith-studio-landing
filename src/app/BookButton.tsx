"use client";

import type { ReactNode } from "react";

const CAL_LINK = "zenith-studio-ai/free-automation-audit";
const CAL_NAMESPACE = "free-automation-audit";
export const BOOKING_URL = `https://cal.com/${CAL_LINK}`;

type CalApi = ((action: string, options?: unknown) => void) & {
  ns?: Record<string, (action: string, options?: unknown) => void>;
};

/**
 * Booking CTA.
 *
 * Renders a real anchor so the link works without JavaScript, on middle-click,
 * and for crawlers. When Cal's embed has loaded we cancel the navigation and
 * open the calendar in a modal instead, which keeps the visitor on the page.
 *
 * Cal's own element-click handler rewrites the href but does not call
 * preventDefault, so the browser follows the link before the modal can open.
 * Intercepting here is what actually makes the modal appear.
 */
export default function BookButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={BOOKING_URL}
      className={className}
      onClick={(event) => {
        // Let modified clicks (new tab, new window) behave normally.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

        const cal = (window as unknown as { Cal?: CalApi }).Cal;
        const open = cal?.ns?.[CAL_NAMESPACE] ?? cal;
        if (typeof open !== "function") return; // embed not ready: follow the href

        event.preventDefault();
        open("modal", {
          calLink: CAL_LINK,
          config: { layout: "month_view" },
        });
      }}
    >
      {children}
    </a>
  );
}
