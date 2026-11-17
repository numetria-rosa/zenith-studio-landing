import { serveStaticHtml } from "@/lib/static-html";

/* /demo/<country>/<serviceName> - dynamic country segment on purpose (see
   CLAUDE.md): the WhatsApp Umrah product launches UK-only, but more
   countries get added by dropping a new file under public/demos/<country>/
   and a line in PAGES below - no new route. The folder here is named
   [slug] rather than [country] because Next.js requires every dynamic
   segment at this path depth to share one param name, and the sibling
   src/app/demo/[slug]/page.tsx (other services' single-segment demo
   pages) already claims "slug" - same "serve a static file verbatim"
   pattern as those pages, just one segment deeper. */
const PAGES: Record<string, Record<string, string>> = {
  uk: {
    "whatsapp-umrah-agent": "uk/whatsapp-umrah-agent.html",
  },
  // Generated from the UK page by scripts/build-umrah-country-demos.mjs (local currency and cities).
  us: { "whatsapp-umrah-agent": "us/whatsapp-umrah-agent.html" },
  ca: { "whatsapp-umrah-agent": "ca/whatsapp-umrah-agent.html" },
  au: { "whatsapp-umrah-agent": "au/whatsapp-umrah-agent.html" },
  za: { "whatsapp-umrah-agent": "za/whatsapp-umrah-agent.html" },
  fr: { "whatsapp-umrah-agent": "fr/whatsapp-umrah-agent.html" },
};

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; serviceName: string }> }) {
  const { slug: country, serviceName } = await params;
  const relativePath = PAGES[country]?.[serviceName];
  if (!relativePath) return new Response("Not found", { status: 404 });

  return serveStaticHtml(request, `demos/${relativePath}`);
}
