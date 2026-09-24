import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Default (1mb) is too small for a real scanned policy/ACORD PDF upload
  // in Insurance Document Audit - Claude's own document limit is 32mb, 10mb
  // is a generous, safe ceiling well short of that.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      // The dashboard moved under /lab; keep the old URL alive for anyone
      // with it bookmarked or cached from before the move.
      { source: "/dashboard", destination: "/lab/dashboard", permanent: true },
      { source: "/proposal/:token", destination: "/proposals/view/:token", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
