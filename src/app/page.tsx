export default function ZenithStudioLandingPage() {
  const services = [
    {
      title: "AI Automation Workflows",
      description:
        "End-to-end intelligent automation built with n8n — from lead routing and CRM syncing to multi-step AI agent chains that handle complex business logic without human intervention.",
      tag: "Core Service",
    },
    {
      title: "Advanced Coding & Scripting",
      description:
        "Custom Python, Node.js, and API integrations that power the workflows no-code tools can't reach — data pipelines, web scrapers, internal tools, and backend systems built from scratch.",
      tag: "Core Service",
    },
    {
      title: "Zenith AI",
      description:
        "Coming Soon — Focused on building intelligent automation systems for modern businesses. We design and deploy scalable solutions that handle lead generation, customer communication, and operational workflows, allowing companies to grow faster with less manual effort and hours saved. One-time plug-and-play systems like AI Receptionist & Appointment Systems, AI Lead Capture & Follow-Up Systems, and more — for more quality and less wasted work hours.",
      tag: "Coming Soon",
    },
    {
      title: "Zenith Lab",
      description:
        "Coming Soon — Advanced academic-level courses for skills that won't be replaced by AI in 2026/2027. Each course includes a Career Path Edition, so you don't just learn — you know exactly where to apply it and how to get paid.",
      tag: "Coming Soon",
    },
  ];

  const products = [
    {
      icon: "◈",
      title: "Get Paid to Build n8n Workflows",
      description:
        "From $0 to $50/Hour with n8n Automation — a complete blueprint to turn workflow building into a paid skill, even if you're starting from zero.",
      link: "https://whop.com/checkout/plan_aERQUZX70CcQ9",
    },
    {
      icon: "▣",
      title: "Build Your First $50 Workflow in 40 Minutes",
      description:
        "I made $50 in one afternoon with a workflow I built in 40 minutes — step-by-step breakdown so you can replicate it the same day.",
      link: "https://whop.com/checkout/plan_tSZGq70OEyzsn",
    },
    {
      icon: "◉",
      title: "The $0 AI Automation Playbook For ANY Business",
      description:
        "Replace a Full-Time Employee with Automated Workflows Without Spending a Dime — proven templates and strategies that work across every industry.",
      link: "https://whop.com/checkout/plan_5mDFoE473UAcH",
    },
    {
      icon: "✦",
      title: "AI Email Auto-Responder (Gmail + n8n)",
      description:
        "This n8n Workflow Literally Replies to Your Emails While You Sleep. Imagine waking up to a completely organized inbox with all your routine emails already answered. No more hours spent sorting through messages, drafting generic replies, or playing catch-up. Our plug-and-play Gmail + n8n system does the heavy lifting while you sleep.",
      link: "https://whop.com/checkout/plan_uCuJmMtPlV4fp",
    },
  ];

  const portfolio = [
    {
      name: "VoyAI",
      category: "AI Travel SaaS",
      tagline: "Your entire trip, planned in 60 seconds.",
      description:
        "An AI travel planner that turns a few prompts into real itineraries — live hotel prices, flights, and bookable tours. Powered by the Atlas & Awe platform.",
      href: "https://voyai.site",
      image: "/work/voyai.png",
      accent: "from-sky-400/50 via-indigo-500/40 to-blue-600/50",
    },
    {
      name: "SmartRevise",
      category: "AI Study SaaS",
      tagline: "Notes into exam-ready knowledge.",
      description:
        "Paste notes or a PDF and instantly get AI flashcards, spaced repetition, quizzes, mock exams, and a personal tutor. Powered by the A+ Academy platform.",
      href: "https://smartrevise.site",
      image: "/work/smartrevise.png",
      accent: "from-emerald-300/50 via-teal-500/40 to-green-600/50",
    },
    {
      name: "Atlas & Awe",
      category: "Travel Platform",
      tagline: "Travel, smartly.",
      description:
        "An independent European travel publication and the audience platform behind VoyAI — 120+ curated guides across 15+ countries.",
      href: "https://atlasandawe.blog",
      image: "/work/atlasandawe.png",
      accent: "from-amber-300/50 via-orange-500/40 to-rose-500/50",
    },
    {
      name: "A+ Academy",
      category: "EdTech Platform",
      tagline: "Online learning & exam-prep academy.",
      description:
        "The learning platform behind SmartRevise — courses, student tools, and a streamlined study experience.",
      href: "https://aplusacademy.site",
      image: null,
      accent: "from-fuchsia-400/50 via-purple-500/40 to-pink-600/50",
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
              />
              <div>
                <div className="text-sm tracking-[0.35em] text-white/60 uppercase">Zenith</div>
                <div className="text-base font-semibold -mt-0.5">Studio</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
              <a href="#work" className="hover:text-white transition-colors">Work</a>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#products" className="hover:text-white transition-colors">Products</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            <a
              href="#products"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] transition hover:bg-white/15"
            >
              Get Access
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 min-h-[calc(100vh-110px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 backdrop-blur-xl">
              Automation systems for ANY business
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
                href="#products"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                View Products
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["n8n Workflows", "AI automation, API chains, smart routing"],
                ["Custom Scripting", "Python, Node.js, data pipelines from scratch"],
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

          <div className="relative min-h-[620px] lg:min-h-[680px]">
            <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-fuchsia-500/20 blur-[110px]" />
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

            <div className="absolute bottom-[30%] left-[0%] rounded-[28px] border border-white/12 bg-white/[0.04] px-4 py-4 backdrop-blur-2xl shadow-[0_0_40px_rgba(89,118,255,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Built for</div>
              <div className="mt-2 text-sm font-medium text-white/85">Real Estate · Travel · Ecommerce</div>
            </div>

            <div className="absolute right-[2%] bottom-[30%] rounded-[26px] border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-2xl shadow-[0_0_30px_rgba(226,109,255,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Core outcome</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Less manual work</div>
              <div className="text-sm text-white/55">More visibility. More speed.</div>
            </div>

            <style>{`
              @keyframes zenithFloat {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-14px); }
                100% { transform: translateY(0px); }
              }
            `}</style>
          </div>
        </section>

        {/* ── Portfolio / Our Products Section ── */}
        <section id="work" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Portfolio · Our products</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              The studio behind the products
            </h2>
            <p className="mt-4 text-white/62 leading-7">
              These aren&apos;t client logos — they&apos;re our own products. Zenith Studio designs, builds,
              and runs them end-to-end: <span className="text-white/85">VoyAI</span> on the{" "}
              <span className="text-white/85">Atlas &amp; Awe</span> platform, and{" "}
              <span className="text-white/85">SmartRevise</span> on the{" "}
              <span className="text-white/85">A+ Academy</span> platform.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:h-[460px] sm:flex-row lg:h-[500px]">
            {portfolio.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative min-h-[200px] flex-1 overflow-hidden rounded-[28px] border border-white/10 transition-[flex] duration-500 ease-out sm:min-h-0 sm:hover:flex-[3.5]"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={`${item.name} website`}
                    className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10 transition-opacity duration-500 sm:from-black/90 sm:via-black/30 sm:to-transparent sm:group-hover:from-black/95 sm:group-hover:via-black/50" />

                <div className="absolute right-4 top-4 z-10 text-xs font-medium uppercase tracking-[0.25em] text-white/45">
                  0{index + 1}
                </div>

                <div className="absolute left-5 top-6 z-10 hidden text-sm font-medium tracking-[0.08em] text-white/85 [writing-mode:vertical-rl] transition-opacity duration-300 sm:block sm:group-hover:opacity-0">
                  {item.name}
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
                  <div className="transition-all duration-500 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/75 backdrop-blur-md">
                        {item.category}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.25em] text-white/45">Built by Zenith</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">{item.name}</h3>
                    <p className="mt-1.5 text-base font-medium text-white/80">{item.tagline}</p>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/60">{item.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                      {item.href.replace("https://", "")}
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">↗</span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Services Section ── */}
        <section id="services" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Services</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">What Zenith Studio builds</h2>
            <p className="mt-4 text-white/62 leading-7">
              Systems designed to make businesses move faster, find better opportunities, and reduce repetitive work.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.title}
                className={`group rounded-[32px] border p-6 backdrop-blur-xl transition hover:-translate-y-1 ${
                  service.tag === "Coming Soon"
                    ? "border-fuchsia-500/20 bg-fuchsia-500/[0.04] hover:bg-fuchsia-500/[0.07]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`h-12 w-12 rounded-2xl shadow-[0_0_30px_rgba(110,130,255,0.16)] ${
                      service.tag === "Coming Soon"
                        ? "bg-gradient-to-br from-fuchsia-400/30 via-purple-500/25 to-pink-500/30"
                        : "bg-gradient-to-br from-cyan-300/30 via-blue-500/25 to-fuchsia-500/30"
                    }`}
                  />
                  {service.tag === "Coming Soon" && (
                    <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-fuchsia-200/80">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects / Live demos — COMMENTED OUT ──
        <section id="projects" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/70">Projects / Live demos</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Systems built to prove value fast</h2>
            </div>
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
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/60"></p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Live preview soon</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Case study ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ── END COMMENTED OUT ── */}

        {/* ── Products Section ── */}
        <section id="products" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-200/70">Products</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Ready-to-use automation assets</h2>
            <p className="mt-4 text-white/62 leading-7">
              Battle-tested playbooks, plug-and-play workflows, and step-by-step systems — everything you need to automate, earn, and scale without starting from zero.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.title}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(75,90,255,0.08)] flex flex-col"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl text-cyan-200 shadow-[0_0_24px_rgba(92,138,255,0.12)]">
                  {product.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{product.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60 flex-1">{product.description}</p>
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                >
                  GET ACCESS
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact / Socials Section ── */}
          <section id="contact" className="mx-auto max-w-7xl py-10 sm:py-16 pb-24">
            <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] p-8 sm:p-10 lg:p-12 backdrop-blur-2xl">
              <div className="text-center max-w-2xl mx-auto">
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Connect</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Stay in the loop
                </h2>
                <p className="mt-4 text-white/62 leading-7">
                  Follow Zenith Studio for new product drops, workflow breakdowns, and behind-the-scenes builds.
                </p>
          
                {/* Whop Shop CTA */}
                <a
                  href="https://whop.com/zenithstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(255,255,255,0.2)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Get Our Products & Services
                </a>
          
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Email */}
                  <a
                    href="mailto:zenith.studio.s@outlook.com"
                    className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <svg className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Email</div>
                      <div className="text-sm font-medium text-white/80">zenith.studio.s@outlook.com</div>
                    </div>
                  </a>
          
                  {/* YouTube */}
                  <a
                    href="https://www.youtube.com/@ZenithStudio-26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <svg className="h-5 w-5 text-white/60 group-hover:text-[#FF0000] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider">YouTube</div>
                      <div className="text-sm font-medium text-white/80">Zenith Studio</div>
                    </div>
                  </a>
          
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/_zenithstudio_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <svg className="h-5 w-5 text-white/60 group-hover:text-[#E4405F] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Instagram</div>
                      <div className="text-sm font-medium text-white/80">@_zenithstudio_</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 sm:px-6 lg:px-10 py-8 text-sm text-white/42">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 Zenith Studio. Custom automation, digital products, and intelligent systems.</div>
          <div className="flex gap-5">
            <a href="#work" className="hover:text-white/70">Work</a>
            <a href="#services" className="hover:text-white/70">Services</a>
            <a href="#products" className="hover:text-white/70">Products</a>
            <a href="#contact" className="hover:text-white/70">Connect</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
