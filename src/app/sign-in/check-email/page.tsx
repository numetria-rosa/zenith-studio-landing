import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-[#05060a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-3 text-sm text-white/60">
          We sent a sign-in link. Click it to continue — it expires after 24 hours.
        </p>
      </div>
    </div>
  );
}
