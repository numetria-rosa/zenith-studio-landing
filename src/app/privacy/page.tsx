export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/50">Last updated September 10, 2026</p>

        <p className="mt-8 text-[15px] leading-7 text-white/75">
          Zenith Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;) builds AI-powered systems and courses for
          businesses and individual learners. This page explains what information we collect, why, and how it
          is used.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Information we collect</h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-7 text-white/75">
          <li>
            <strong>Account information:</strong> name, email address, and purchase history when you buy a
            course or sign up for a service.
          </li>
          <li>
            <strong>Service delivery data:</strong> business details, requirements, and messages you submit
            through your project workspace when we build and operate an AI system for you.
          </li>
          <li>
            <strong>Calendar and email data (AI Billing Clerk clients only):</strong> if you connect a Google
            or Microsoft account to the AI Billing Clerk service, we access calendar events and email
            metadata (sender, subject, and a short preview) on a read-only basis, solely to draft billable
            time entries for your review. We never send, delete, or modify anything in your calendar or
            inbox, and we never read full email bodies beyond what is needed to draft a one-sentence billing
            narrative. Every draft requires your explicit approval before it is treated as real; nothing is
            sent to a client or invoiced automatically.
          </li>
          <li>
            <strong>Call and message data (AI Receptionist and AI Missed Call Text-Back clients only):</strong>{" "}
            caller phone numbers, call recordings/transcripts, and text message content, used to operate the
            phone/text system you have configured and to improve its accuracy for your business.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">How we use this information</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          We use the information above only to operate the specific service you have signed up for, to bill
          for it, to provide customer support, and to send service-related communications. Calendar and email
          data connected for the AI Billing Clerk is processed by our servers and a third-party AI provider
          (used only to draft a text summary) and is never used for advertising, sold to third parties, or
          used to train any AI model beyond generating your own draft entries.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Third-party services</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          We use trusted third-party providers to deliver our services, including Google and Microsoft (for
          calendar/email access you explicitly authorize), Twilio (for phone and SMS), Vapi (for AI voice
          calls), Cal.com (for appointment booking), Groq (for AI text drafting), Resend (for email delivery),
          and Whop (for payments). Each provider only receives the data necessary to perform its function.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Data retention and deletion</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          We retain data for as long as your account or service is active, or as needed to comply with legal
          obligations. You can revoke Google or Microsoft calendar/email access at any time from your Google
          or Microsoft account settings, or by contacting us, and we will stop syncing new data immediately.
          To request deletion of your data, email us at the address below.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Contact</h2>
        <p className="mt-4 text-[15px] leading-7 text-white/75">
          Questions about this policy or a data request can be sent to{" "}
          <a href="mailto:hello@zenith-studio.site" className="underline">
            hello@zenith-studio.site
          </a>
          .
        </p>
      </div>
    </div>
  );
}
