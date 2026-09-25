"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/* Toast (DESIGN.md: bottom center, mint text, disappears after 2.6s).
   Server actions redirect back with ?flash=<message>; this reads it once,
   shows it, then strips it from the URL so a refresh doesn't re-show it. */
export function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flash = searchParams.get("flash");
  const [visible, setVisible] = useState(!!flash);

  useEffect(() => {
    if (!flash) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 2600);
    const params = new URLSearchParams(searchParams);
    params.delete("flash");
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
    return () => clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  if (!flash || !visible) return null;
  return (
    <div className="toast" role="status">
      {flash}
    </div>
  );
}
