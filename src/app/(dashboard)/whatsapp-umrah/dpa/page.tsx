export const metadata = { title: "Data Processing Agreement - WhatsApp AI Agent" };

/* Draft only - not reviewed by a lawyer. Standard UK GDPR
   controller/processor terms for this product's shape (agency = data
   controller of their own customers' data, Zenith = processor - see
   CLAUDE.md §7). Get this reviewed by a solicitor before relying on it
   for a real dispute; it is a reasonable starting template, not legal
   advice. */
export default function WhatsAppUmrahDpaPage() {
  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Data Processing Agreement</h1>
        <p className="mt-2 text-sm text-white/50">WhatsApp AI Agent for Umrah Agencies - draft template, last updated September 2026</p>
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-[13px] leading-6 text-amber-200/90">
          This page is a draft template, not reviewed by a solicitor. It sets out reasonable, standard terms for how Zenith
          Studio processes data on your behalf, but you should have it checked before relying on it for a live dispute or a
          customer&apos;s own compliance audit.
        </p>

        <p className="mt-8 text-[15px] leading-7 text-white/75">
          This agreement applies between your agency (&ldquo;you&rdquo;, the <strong>data controller</strong>) and Zenith
          Studio (&ldquo;we&rdquo;, the <strong>data processor</strong>) for the WhatsApp AI Agent service. Your customers
          are the data subjects. You decide what the agent is allowed to say and what packages, prices and policies it
          answers from; we process the resulting messages on your behalf, strictly to operate the service.
        </p>

        <h2 className="mt-10 text-lg font-semibold">What we process, and why</h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-7 text-white/75">
          <li>
            <strong>Customer WhatsApp messages:</strong> inbound and outbound message content, phone numbers, and
            timestamps, processed to answer enquiries, capture leads, and hand off to your team.
          </li>
          <li>
            <strong>Your knowledge base:</strong> packages, prices, dates, policies and ATOL details you provide, used
            only to ground the agent&apos;s answers to your own customers.
          </li>
          <li>
            <strong>Passport or payment details:</strong> the agent is instructed to never ask for these, and if a
            customer sends them anyway, the content is never stored in the searchable knowledge base or logs beyond
            the single raw message record - the conversation hands off to your team immediately instead.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Sub-processors</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Message content is sent to Groq (bulk drafting) and, for a small share of escalated replies, Anthropic
          (Claude), both solely to generate a draft reply - never to train a model on your data. WhatsApp delivery is
          via Meta&apos;s WhatsApp Business Platform, under your own WhatsApp Business Account. Billing runs through
          Whop.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Retention and deletion</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Customer data is retained for the period you set in your dashboard (Settings &rarr; &ldquo;Delete customer
          data after&rdquo;), 12 months by default, after which it is permanently deleted automatically. You can export
          or permanently delete any one customer&apos;s data at any time from the Inbox, to fulfil a data subject
          access or erasure request from your own customer.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Security</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Your WhatsApp access token is encrypted at rest. Every query touching your agency&apos;s data is scoped to
          your agency alone - other agencies on the platform cannot read your data, and we test this directly.
        </p>

        <h2 className="mt-10 text-lg font-semibold">WhatsApp opt-in wording for your own customers</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Where you invite customers to message you on WhatsApp (a website button, a Click-to-WhatsApp ad, a QR code),
          use wording like this so their consent to an automated reply is clear upfront:
        </p>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 text-[14px] leading-6 text-white/80">
          &ldquo;Message us on WhatsApp and we&apos;ll reply using our virtual assistant, which answers from our own
          packages and policies. A member of our team can take over at any time. Your message and reply history is
          kept for up to {"{"}your retention period{"}"} to help us serve you, and you can ask us to delete it at any
          time.&rdquo;
        </div>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          The agent itself never claims to be human if asked directly, and always states it is your virtual
          assistant - this wording just makes that clear before the first message, as PECR and UK GDPR expect for an
          automated channel.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Contact</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Questions about this agreement or a data request can be sent to{" "}
          <a href="mailto:hello@zenith-studio.site" className="underline">
            hello@zenith-studio.site
          </a>
          .
        </p>
      </div>
    </div>
  );
}
