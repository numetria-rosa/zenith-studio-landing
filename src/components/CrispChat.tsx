"use client";

import { useEffect } from "react";

/* Free-tier Crisp live-chat widget for the client service dashboard.
   No-ops until NEXT_PUBLIC_CRISP_WEBSITE_ID is set - create a free
   account at crisp.chat, grab the Website ID from Settings > Setup
   instructions, add it as an env var. Nothing renders or loads until
   then, so this is safe to ship ahead of having the ID. */
export default function CrispChat() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId || typeof window === "undefined") return;

    (window as unknown as { $crisp: unknown[]; CRISP_WEBSITE_ID: string }).$crisp = [];
    (window as unknown as { $crisp: unknown[]; CRISP_WEBSITE_ID: string }).CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
