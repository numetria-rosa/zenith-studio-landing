import Link from "next/link";
import { BrandMark } from "@/components/site/BrandMark";
import { WaIcon, type WaIconName } from "@/components/wa/Icon";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Data Processing Agreement - WhatsApp AI Agent" };

/* Draft only - not reviewed by a lawyer. Standard UK GDPR controller/processor terms for this product's shape (agency =
   data controller of their own customers' data, Zenith = processor - see CLAUDE.md section 7). Get this reviewed by a
   solicitor before relying on it for a real dispute; it is a reasonable starting template, not legal advice.
   Keep the sub-processor list in step with the services the product really calls. */

const SECTIONS = ["Who's who", "What we process", "Sub-processors", "Retention and deletion", "Security", "Opt-in wording", "Contact"];

const PARTIES: { icon: WaIconName; tag: string; name: string; text: string; tint: string }[] = [
  { icon: "person", tag: "DATA CONTROLLER", name: "Your agency", text: "\"You\". You decide what the agent says and answers from.", tint: "#5CC8FF" },
  { icon: "shield", tag: "DATA PROCESSOR", name: "Zenith Studio", text: "\"We\". We process messages on your behalf to run the service.", tint: "#8B5CF6" },
  { icon: "users", tag: "DATA SUBJECTS", name: "Your customers", text: "The people who message your agency on WhatsApp.", tint: "#3DDC97" },
];

const PROCESSED: { icon: WaIconName; title: string; text: string; badge?: string }[] = [
  { icon: "chat", title: "Customer WhatsApp messages", text: "Inbound and outbound message content, phone numbers, and timestamps, processed to answer enquiries, capture leads, and hand off to your team." },
  { icon: "book", title: "Your knowledge base", text: "Packages, prices, dates, policies and ATOL details you provide, used only to ground the agent's answers to your own customers." },
  { icon: "shield", title: "Passport or payment details", badge: "NEVER REQUESTED", text: "The agent is instructed to never ask for these, and if a customer sends them anyway, the content is never stored in the searchable knowledge base or logs beyond the single raw message record. The conversation hands off to your team immediately instead." },
];

const PROCESSORS: [string, string, string][] = [
  ["Groq", "AI DRAFTING", "Message content, for bulk reply drafting"],
  ["Anthropic (Claude)", "AI DRAFTING", "Message content, for a small share of escalated replies"],
  ["Meta", "DELIVERY", "WhatsApp Business Platform, under your own WhatsApp Business Account"],
  ["Voyage AI", "SEARCH", "Knowledge base text, to create the search embeddings"],
  ["Neon", "DATABASE", "Data storage (database)"],
  ["Vercel", "HOSTING", "Hosting"],
  ["Resend", "EMAIL", "Team alert emails"],
  ["Whop", "BILLING", "Subscription billing"],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const CARD = "rounded-2xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.03)]";
const MONO = "font-mono text-[10.5px] tracking-[.12em] text-dim";

function Heading({ n, children }: { n: number; children: string }) {
  return (
    <h2 id={slug(children)} className="mt-14 flex scroll-mt-8 items-baseline gap-3 text-[20px] font-semibold">
      <span className="font-mono text-[11px] text-[#5CC8FF]">{String(n).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

export default function WhatsAppUmrahDpaPage() {
  return (
    <div className="min-h-screen bg-void font-sans text-frost">
      <header className="flex items-center justify-between px-10 py-5 print:hidden">
        <div className="flex items-center gap-4">
          <BrandMark size="sm" />
          <span className={MONO}>LEGAL</span>
        </div>
        <Link href="/my-services" className="text-[12.5px] text-mist no-underline">&larr; Back to dashboard</Link>
      </header>

      <div className="mx-auto flex max-w-[1080px] gap-12 px-10 pb-20 pt-10">
        <aside className="sticky top-8 hidden h-fit w-[230px] shrink-0 lg:block print:hidden">
          <div className={MONO}>ON THIS PAGE</div>
          <nav className="mt-3 flex flex-col gap-[2px]">
            {SECTIONS.map((s, i) => (
              <a key={s} href={`#${slug(s)}`} className="flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] text-mist no-underline hover:bg-[rgba(255,255,255,.04)] hover:text-frost">
                <span className="font-mono text-[10px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </a>
            ))}
          </nav>
          <div className={`${CARD} mt-8 p-4`}>
            <div className="text-[13px] font-semibold">Signing for your agency?</div>
            <p className="mt-1 text-[12px] leading-5 text-dim">Download the PDF to keep with your compliance records.</p>
            <PrintButton label="Download PDF" icon="download" className="mt-3 w-full justify-center" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="font-mono text-[11px] tracking-[.14em] text-[#5CC8FF]">WHATSAPP AI AGENT FOR TRAVEL AGENCIES</div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-[40px] font-extrabold leading-tight tracking-tight">Data Processing Agreement</h1>
            <div className="flex gap-2 pt-2">
              <PrintButton label="Download PDF" icon="download" />
              <PrintButton label="Print" icon="file" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-full border border-[rgba(255,210,122,.4)] bg-[rgba(255,210,122,.08)] px-3 py-1 font-mono text-[10px] tracking-[.1em] text-[#FFD27A]">DRAFT TEMPLATE</span>
            <span className="font-mono text-[11px] text-dim">Last updated September 2026</span>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[rgba(255,210,122,.25)] bg-[rgba(255,210,122,.05)] px-5 py-4 text-[13px] leading-6 text-[#FFD27A]">
            <WaIcon name="info" size={16} className="mt-1 shrink-0" />
            <p>This page is a draft template, not reviewed by a solicitor. It sets out reasonable, standard terms for how Zenith Studio processes data on your behalf, but you should have it checked before relying on it for a live dispute or a customer&apos;s own compliance audit.</p>
          </div>

          <Heading n={1}>Who&apos;s who</Heading>
          <p className="mt-4 text-[14.5px] leading-7 text-mist">This agreement applies between your agency and Zenith Studio for the WhatsApp AI Agent service. You decide what the agent is allowed to say and what packages, prices and policies it answers from; we process the resulting messages on your behalf, strictly to operate the service.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PARTIES.map((p) => (
              <div key={p.tag} className={`${CARD} p-5`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: `${p.tint}1A`, border: `1px solid ${p.tint}55` }}>
                  <WaIcon name={p.icon} size={16} stroke={p.tint} />
                </span>
                <div className={`${MONO} mt-4`} style={{ color: p.tint }}>{p.tag}</div>
                <div className="mt-1 text-[15px] font-semibold">{p.name}</div>
                <p className="mt-1 text-[12.5px] leading-5 text-dim">{p.text}</p>
              </div>
            ))}
          </div>

          <Heading n={2}>What we process</Heading>
          <div className={`${CARD} mt-5 divide-y divide-[rgba(255,255,255,.07)]`}>
            {PROCESSED.map((p) => (
              <div key={p.title} className="flex gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.04)]">
                  <WaIcon name={p.icon} size={16} stroke="#A9AEBA" />
                </span>
                <div>
                  <div className="flex items-center gap-3 text-[14.5px] font-semibold">
                    {p.title}
                    {p.badge && <span className="rounded-full border border-[rgba(255,155,176,.4)] px-2 py-[2px] font-mono text-[9.5px] tracking-[.1em] text-[#FF9BB0]">{p.badge}</span>}
                  </div>
                  <p className="mt-1 text-[13.5px] leading-6 text-mist">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          <Heading n={3}>Sub-processors</Heading>
          <div className={`${CARD} mt-5 overflow-hidden`}>
            <div className={`${MONO} grid grid-cols-[1.3fr_.8fr_2fr] gap-4 border-b border-[rgba(255,255,255,.07)] px-5 py-3`}>
              <span>PROVIDER</span><span>ROLE</span><span>WHAT FOR</span>
            </div>
            {PROCESSORS.map(([name, role, what]) => (
              <div key={name} className="grid grid-cols-[1.3fr_.8fr_2fr] items-center gap-4 border-b border-[rgba(255,255,255,.05)] px-5 py-3 text-[13px] last:border-b-0">
                <span className="font-semibold">{name}</span>
                <span><span className="rounded-md border border-[rgba(255,255,255,.1)] px-2 py-[3px] font-mono text-[9.5px] tracking-[.08em] text-dim">{role}</span></span>
                <span className="text-mist">{what}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-[rgba(61,220,151,.25)] bg-[rgba(61,220,151,.05)] px-4 py-3 text-[12.5px] text-[#7FF0BD]">
            <WaIcon name="shield" size={14} />
            Message content goes to Groq and Anthropic solely to generate a draft reply, never to train a model on your data.
          </div>

          <Heading n={4}>Retention and deletion</Heading>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={`${CARD} p-5`}>
              <div className={MONO}>AUTOMATIC</div>
              <div className="mt-2 text-[30px] font-semibold">12 <span className="text-[14px] font-normal text-dim">months by default</span></div>
              <p className="mt-2 text-[13px] leading-6 text-mist">Customer data is kept for the period you set in your dashboard (Settings, &ldquo;Delete customer data after&rdquo;), then permanently deleted automatically.</p>
            </div>
            <div className={`${CARD} p-5`}>
              <div className={MONO}>ON REQUEST</div>
              <div className="mt-3 flex gap-2 text-[12px]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,.12)] px-3 py-1"><WaIcon name="download" size={12} />Export</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,155,176,.35)] px-3 py-1 text-[#FF9BB0]"><WaIcon name="trash" size={12} />Delete</span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-mist">Export or permanently delete any one customer&apos;s data at any time from the Inbox, to fulfil a data subject access or erasure request from your own customer.</p>
            </div>
          </div>

          <Heading n={5}>Security</Heading>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 text-[14px] font-semibold"><WaIcon name="shield" size={14} />Encrypted token</div>
              <p className="mt-2 text-[13px] leading-6 text-mist">Your WhatsApp access token is encrypted at rest.</p>
            </div>
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 text-[14px] font-semibold"><WaIcon name="users" size={14} />Your data stays yours</div>
              <p className="mt-2 text-[13px] leading-6 text-mist">Every query touching your agency&apos;s data is scoped to your agency alone. Other agencies on the platform cannot read your data, and we test this directly.</p>
            </div>
          </div>

          <Heading n={6}>Opt-in wording</Heading>
          <p className="mt-4 text-[14.5px] leading-7 text-mist">Where you invite customers to message you on WhatsApp, use wording like this so their consent to an automated reply is clear upfront.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-dim">
            Use it on
            {["Website button", "Click-to-WhatsApp ad", "QR code"].map((c) => <span key={c} className="rounded-full border border-[rgba(255,255,255,.1)] px-3 py-1 text-mist">{c}</span>)}
          </div>
          <div className="mt-4 rounded-2xl border border-[rgba(61,220,151,.3)] bg-[rgba(61,220,151,.04)] p-5">
            <div className="font-mono text-[10.5px] tracking-[.12em] text-[#7FF0BD]">READY TO PASTE</div>
            <p className="mt-3 text-[14.5px] leading-7">
              &ldquo;Message us on WhatsApp and we&apos;ll reply using our virtual assistant, which answers from our own packages and policies. A member of our team can take over at any time. Your message and reply history is kept for up to <code className="rounded bg-[rgba(255,255,255,.08)] px-1 font-mono text-[13px] text-[#FFD27A]">your retention period</code> to help us serve you, and you can ask us to delete it at any time.&rdquo;
            </p>
          </div>
          <p className="mt-4 text-[12.5px] leading-6 text-dim">The agent itself never claims to be human if asked directly, and always states it is your virtual assistant. This wording just makes that clear before the first message, as PECR and UK GDPR expect for an automated channel.</p>

          <Heading n={7}>Contact</Heading>
          <div className={`${CARD} mt-5 flex items-center justify-between gap-4 p-5`}>
            <div className="flex items-center gap-3 text-[14px] font-semibold"><WaIcon name="chat" size={16} />Questions about this agreement, or a data request</div>
            <a href="mailto:hello@zenith-studio.site" className="rounded-full border border-[rgba(255,255,255,.12)] px-4 py-2 text-[13px] text-frost no-underline">hello@zenith-studio.site</a>
          </div>
        </main>
      </div>

      <footer className="flex justify-between border-t border-[rgba(255,255,255,.07)] px-10 py-5 text-[11.5px] text-dim">
        <span>&copy; 2026 Zenith Studio &middot; zenith-studio.site</span>
        <span>Draft template &middot; not legal advice</span>
      </footer>
    </div>
  );
}
