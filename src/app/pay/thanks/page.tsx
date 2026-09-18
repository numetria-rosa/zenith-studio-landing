export const metadata = { title: "Payment received - Zenith Studio" };

export default function PaymentThanksPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-6 text-white">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15">
          <svg viewBox="0 0 24 24" fill="none" stroke="#c6f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Payment received</h1>
        <p className="mt-3 text-[15px] leading-7 text-white/70">
          Thanks for your payment. We will reach out shortly to confirm your domain and get your site live.
          If you have not already sent us a domain, reply to the text or email you received and let us know.
        </p>
      </div>
    </div>
  );
}
