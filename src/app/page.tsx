export default function ZenithStudioLandingPage() {
  const services = [
    {
      title: "Custom Automation Systems",
      description:
        "Bespoke scraping, workflow, and AI-assisted systems that replace repetitive manual work with reliable pipelines.",
    },
    {
      title: "Data Extraction & Intelligence",
      description:
        "Listing intelligence, lead sourcing, competitor monitoring, and structured datasets built for fast decisions.",
    },
    {
      title: "Dashboards & Internal Tools",
      description:
        "Clean interfaces for teams to track deals, alerts, opportunities, and operations in one place.",
    },
  ];

  const demos = [
    "CRE Deal Intelligence Engine",
    "Lead Discovery + Outreach Ops",
    "Travel Pricing Monitor",
    "Ecommerce Competitor Tracker",
  ];

  const products = [
    {
      icon: "◈",
      title: "n8n Automation Templates",
      description:
        "Ready-to-deploy flows for lead routing, notifications, enrichment, CRM syncing, and repetitive ops.",
    },
    {
      icon: "▣",
      title: "Lead Generation Add-ons",
      description:
        "Scrapers, enrichers, and export tools for building targeted B2B prospect lists faster.",
    },
    {
      icon: "◉",
      title: "Deal Generator Toolkits",
      description:
        "Real estate deal sourcing systems with listing collection, scoring, broker extraction, and alerts.",
    },
    {
      icon: "✦",
      title: "Travel & Tourism Automations",
      description:
        "Monitoring systems for pricing, inventory, competitor offers, route changes, and booking workflows.",
    },
    {
      icon: "⬢",
      title: "Ecommerce Intelligence Packs",
      description:
        "Product monitoring, pricing changes, catalog extraction, and competitor watch dashboards.",
    },
    {
      icon: "◬",
      title: "Internal Ops Micro-Tools",
      description:
        "Fast utility apps for exporting, deduplicating, validating, organizing, and visualizing messy business data.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(111,144,255,0.18),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(216,82,255,0.18),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(0,183,255,0.12),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-7xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(72,113,255,0.12)]">
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            <div className="flex items-center gap-3">
<img
  src="/icon.png"
  alt="Zenith Studio Icon"
  className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
/>              <div>
                <div className="text-sm tracking-[0.35em] text-white/60 uppercase">Zenith</div>
                <div className="text-base font-semibold -mt-0.5">Studio</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#projects" className="hover:text-white transition-colors">Projects</a>
              <a href="#products" className="hover:text-white transition-colors">Products</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            <a
              href="#contact"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] transition hover:bg-white/15"
            >
              Start a Project
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 min-h-[calc(100vh-110px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 backdrop-blur-xl">
              Futuristic automation systems for modern businesses
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
              Build faster.
              <br />
              Scale sharper.
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
                Automate what matters.
              </span>
            </h1>

            

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#services"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Explore Services
              </a>
              <a
                href="#projects"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                View Live Demos
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["Custom Systems", "Scraping, AI workflows, dashboards, tools"],
                ["Fast Execution", "From idea to a usable prototype quickly"],
                ["Niche Focus", "Built for operational bottlenecks and growth"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(82,98,255,0.08)]"
                >
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/58">{text}</div>
                </div>
              ))}
            </div>
          </div>

<div className="relative min-h-[620px] lg:min-h-[680px]">  <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-fuchsia-500/20 blur-[110px]" />
  <div className="absolute right-6 top-6 h-56 w-56 rounded-full bg-cyan-400/20 blur-[95px]" />
  <div className="absolute left-8 bottom-16 h-52 w-52 rounded-full bg-blue-500/20 blur-[100px]" />

  
  <div className="absolute inset-0 flex items-center justify-center -translate-y-14 lg:-translate-y-24">
  <img
    src="/folder-glass.png"
    alt="Glass Folder"
    className="pointer-events-none select-none drop-shadow-[0_40px_120px_rgba(0,0,0,0.7)] w-[520px] lg:w-[640px]"
    style={{ animation: "zenithFloat 3.2s ease-in-out infinite" }}
  />
</div>

<div className="absolute bottom-[30%] left-[0%] rounded-[28px] border border-white/12 bg-white/[0.04] px-4 py-4 backdrop-blur-2xl shadow-[0_0_40px_rgba(89,118,255,0.12)]">    <div className="text-xs uppercase tracking-[0.2em] text-white/45">Built for</div>
    <div className="mt-2 text-sm font-medium text-white/85">Real Estate · Travel · Ecommerce</div>
  </div>

<div className="absolute right-[2%] bottom-[30%] rounded-[26px] border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-2xl shadow-[0_0_30px_rgba(226,109,255,0.12)]">    <div className="text-xs uppercase tracking-[0.2em] text-white/45">Core outcome</div>
    <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Less manual work</div>
    <div className="text-sm text-white/55">More visibility. More speed.</div>
  </div>

<style>{`
  @keyframes zenithFloat {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-14px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`}</style>
</div>
        </section>

        <section id="services" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Services</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">What Zenith Studio builds</h2>
            <p className="mt-4 text-white/62 leading-7">
              Systems designed to make businesses move faster, find better opportunities, and reduce repetitive work.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-300/30 via-blue-500/25 to-fuchsia-500/30 shadow-[0_0_30px_rgba(110,130,255,0.16)]" />
                <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{service.description}</p>
              </div>
            ))}
            
          </div>
        </section>

        <section id="projects" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/70">Projects / Live demos</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Systems built to prove value fast</h2>
            </div>
            <div className="text-sm text-white/55">Placeholders ready for the live demos you’ll add next.</div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {demos.map((demo, index) => (
              <div
                key={demo}
                className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 blur-[80px]" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Demo {String(index + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{demo}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
                    Sleek landing spot for a real, working system demo. Add screenshots, public links, case-study metrics, and a CTA once each build is ready.
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Live preview soon</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Case study ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-200/70">Products</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Productized tools and automation assets</h2>
            <p className="mt-4 text-white/62 leading-7">
              A mix of digital products, ready-to-sell templates, and business accelerators for teams that want better systems without starting from zero.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.title}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(75,90,255,0.08)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl text-cyan-200 shadow-[0_0_24px_rgba(92,138,255,0.12)]">
                  {product.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{product.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{product.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl py-10 sm:py-16 pb-24">
          <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] p-8 sm:p-10 lg:p-12 backdrop-blur-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Contact</div>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Need a system that makes your business faster, smarter, and less manual?
                </h2>
                <p className="mt-4 max-w-2xl text-white/62 leading-7">
                  Zenith Studio builds custom solutions around operational bottlenecks, growth opportunities, and repetitive data work. Reach out for a custom build, a product request, or a live demo.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/20 p-6">
                <div className="text-sm font-semibold text-white">What you can put here next</div>
                <div className="mt-4 space-y-3 text-sm text-white/62">
                  <div>• Upwork profile link</div>
                  <div>• Email contact</div>
                  <div>• Calendly / booking link</div>
                  <div>• Product request form</div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Book a Call</a>
                  <a href="#" className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white">See Projects</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 sm:px-6 lg:px-10 py-8 text-sm text-white/42">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 Zenith Studio. Custom automation, data systems, and digital products.</div>
          <div className="flex gap-5">
            <a href="#services" className="hover:text-white/70">Services</a>
            <a href="#projects" className="hover:text-white/70">Projects</a>
            <a href="#products" className="hover:text-white/70">Products</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
