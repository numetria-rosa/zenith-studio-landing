"use client";

import { useEffect } from "react";

/** Opens the browser's print dialog once the sheet has rendered (used by the hub's Print buttons). */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}
