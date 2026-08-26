import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The dashboard moved under /lab; keep the old URL alive for anyone
      // with it bookmarked or cached from before the move.
      { source: "/dashboard", destination: "/lab/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
