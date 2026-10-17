import Link from "next/link";

export const metadata = { title: "Data Deletion" };

const p = "mt-4 text-[15px] leading-7 text-white/75";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">How to delete your data</h1>
        <p className="mt-2 text-sm text-white/50">Last updated October 17, 2026</p>

        <p className="mt-8 text-[15px] leading-7 text-white/75">
          You can ask Zenith Studio to delete the data we hold about you at any time. This covers data we
          receive through Meta (for example a WhatsApp Business account connected to our WhatsApp AI Agent) as
          well as your Zenith Studio account.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Agencies and businesses</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-7 text-white/75">
          <li>
            Email{" "}
            <a href="mailto:hello@zenith-studio.site?subject=Data%20deletion%20request" className="underline">
              hello@zenith-studio.site
            </a>{" "}
            from the address on your account, with the subject &ldquo;Data deletion request&rdquo;.
          </li>
          <li>
            We delete your knowledge base, conversations, contacts, settings and the stored (encrypted) WhatsApp
            access token within 30 days, and confirm by email. Purchase records are kept only as long as tax law
            requires.
          </li>
          <li>
            You can also disconnect our app at any time from Meta Business Suite (Business settings, then
            Integrations or Connected apps). We stop receiving new messages straight away.
          </li>
        </ol>

        <h2 className="mt-10 text-lg font-semibold">Customers who messaged an agency on WhatsApp</h2>
        <p className={p}>
          The travel agency you messaged controls your conversation data, and we process it on its behalf. Ask
          the agency to delete it, or email us at the address above with the agency&apos;s name and your phone
          number and we will pass the request on and delete the data once the agency confirms. Each agency also
          sets a retention period (12 months by default), after which conversations are deleted automatically.
        </p>

        <h2 className="mt-10 text-lg font-semibold">More information</h2>
        <p className={p}>
          See our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          for what we collect and why.
        </p>
      </div>
    </div>
  );
}
