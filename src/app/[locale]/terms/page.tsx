import Link from "next/link";

export const metadata = { title: "Terms of Service" };

const p = "mt-4 text-[15px] leading-7 text-white/75";
const h2 = "mt-10 text-lg font-semibold";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-white/50">Last updated October 17, 2026</p>

        <p className="mt-8 text-[15px] leading-7 text-white/75">
          These terms apply to the courses, AI systems and software Zenith Studio provides through
          zenith-studio.site. By buying or using them you agree to these terms.
        </p>

        <h2 className={h2}>Accounts and payment</h2>
        <p className={p}>
          Purchases are processed by Whop, which acts as merchant of record. Subscriptions renew until you
          cancel them from your Whop account. Course access is for your own personal use and may not be shared
          or resold.
        </p>

        <h2 className={h2}>AI systems and the WhatsApp AI Agent</h2>
        <p className={p}>
          Our AI assistants act on information you give us. You are responsible for keeping that information
          accurate (for example package prices, dates and policies) and for the decisions you make. Assistants
          hand anything outside their scope to your staff and never claim to be human.
        </p>
        <p className={p}>
          If you connect a WhatsApp Business account, you must follow Meta&apos;s WhatsApp Business terms and
          policies, including only messaging people who contacted you or opted in. Meta bills you directly for
          WhatsApp messaging on the payment method you add in Meta Business Suite; our price covers our software
          only. For your customers&apos; data you are the data controller and we are your processor, as set out
          in the{" "}
          <Link href="/whatsapp-umrah/dpa" className="underline">
            data processing agreement
          </Link>
          .
        </p>

        <h2 className={h2}>Acceptable use</h2>
        <p className={p}>
          You may not use our services to send spam, to mislead people, to collect passport or payment card
          details through the assistant, or for anything unlawful. We may suspend a service that is used this
          way.
        </p>

        <h2 className={h2}>Availability and liability</h2>
        <p className={p}>
          We work to keep our services running but cannot promise they will be uninterrupted, and third-party
          platforms (such as Meta, AI model providers and phone carriers) can change or fail. To the extent the
          law allows, our total liability is limited to the amount you paid us in the 12 months before the
          claim.
        </p>

        <h2 className={h2}>Your data</h2>
        <p className={p}>
          See our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/data-deletion" className="underline">
            how to delete your data
          </Link>
          .
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={p}>
          Questions about these terms can be sent to{" "}
          <a href="mailto:hello@zenith-studio.site" className="underline">
            hello@zenith-studio.site
          </a>
          .
        </p>
      </div>
    </div>
  );
}
