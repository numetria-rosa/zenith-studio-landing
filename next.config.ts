import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// @signalwire/compatibility-api loads its dependencies through a runtime
// createRequire(), which Vercel's file tracer can't follow, so the deployed
// functions shipped without lodash and every page importing SignalWire 500'd.
// Walk its real dependency tree here so the list can't go stale on upgrade.
function dependencyTree(pkg: string): string[] {
  const seen = new Set<string>();
  const resolveDir = (name: string, fromDir: string): string | null => {
    for (let d = fromDir; ; d = path.dirname(d)) {
      const candidate = path.join(d, "node_modules", name);
      if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
      if (path.dirname(d) === d) return null;
    }
  };
  const walk = (dir: string) => {
    const deps = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).dependencies ?? {};
    for (const dep of Object.keys(deps)) {
      const found = resolveDir(dep, dir);
      if (!found) continue;
      const rel = path.relative(process.cwd(), found).split(path.sep).join("/");
      if (!seen.has(rel)) {
        seen.add(rel);
        walk(found);
      }
    }
  };
  walk(path.join(process.cwd(), "node_modules", pkg));
  return [`node_modules/${pkg}`, ...seen].map((dir) => `./${dir}/**/*`);
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": dependencyTree("@signalwire/compatibility-api"),
  },
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
