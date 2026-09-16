import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
