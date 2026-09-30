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
  // The package itself is already traced; only its runtime-required deps
  // are missing. Including the package too would add ~48 MB per function.
  return [...seen].map((dir) => `./${dir}/**/*`);
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": dependencyTree("@signalwire/compatibility-api"),
    // The AI Engineering course app reads its content (lessons, the agent kit) from disk at request time.
    "/lab/ai-engineering/**": ["./content/ai-engineering/**/*"],
  },
  // Functions sat right at Vercel's 250 MB limit. Nothing here is loaded at
  // runtime: SignalWire only uses dist/index.node.(m)js (its maps are 24.5 MB,
  // lib/ is 16 MB), and no dependency needs its source maps or type files.
  outputFileTracingExcludes: {
    // This route reads files via a runtime path (process.cwd() + contentDir),
    // so the tracer bundled nearly the whole repo: marketing images, mockups,
    // scripts, even a leads spreadsheet. It only ever serves from courses/.
    "/courses/**": [
      "./insta/**/*",
      "./linkedin/**/*",
      "./public/**/*",
      "./halo/**/*",
      "./scripts/**/*",
      "./law-firm-client-scripts/**/*",
      "./real-estate-client-scripts/**/*",
      "./whop-product-images/**/*",
      "./zenith-ai-kit/**/*",
      "./web-dev/**/*",
      "./playbook/**/*",
      "./n8n_course_zenith_html/**/*",
      "./*.xlsx",
      "./*.md",
    ],
    "/**": [
      // Several server modules read files through process.cwd() (the AI Engineering course content, the
      // /demo and /services HTML), which the tracer cannot follow, so every route that imports them was
      // bundling the whole repo: insta/ 86 MB, public/ 40 MB, halo/ 12 MB, linkedin/ 11 MB, scripts/, tests/...
      // That pushed 149 functions to ~270 MB against Vercel's 250 MB limit. At runtime the server only reads
      // content/, courses/, public/demos/ and public/services-catalog.html, so everything below is dead weight
      // (static files in public/ are served by the CDN, not by functions).
      "./insta/**/*",
      "./linkedin/**/*",
      "./halo/**/*",
      "./scripts/**/*",
      "./tests/**/*",
      "./docs/**/*",
      "./web-dev/**/*",
      "./whop-product-images/**/*",
      "./n8n_course_zenith_html/**/*",
      "./law-firm-client-scripts/**/*",
      "./real-estate-client-scripts/**/*",
      "./playbook/**/*",
      "./zenith-ai-kit/**/*",
      "./public/insta/**/*",
      "./public/linkedin/**/*",
      "./public/sites/**/*",
      "./public/favicon/**/*",
      "./public/logos/**/*",
      "./public/work/**/*",
      "./public/lab/**/*",
      "./*.xlsx",
      "./node_modules/@signalwire/compatibility-api/lib/**/*",
      "./node_modules/**/*.map",
      "./node_modules/**/*.d.ts",
      "./node_modules/**/*.d.mts",
      "./node_modules/**/*.d.cts",
    ],
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
