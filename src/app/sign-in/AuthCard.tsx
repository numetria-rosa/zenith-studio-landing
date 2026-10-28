import Link from "next/link";
import { Geist } from "next/font/google";
import { BrandMark } from "@/components/site/BrandMark";

const sans = Geist({ subsets: ["latin"], weight: ["400", "500", "600"] });

/* Shared shell for the forgot / reset password pages. */
export const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-[16px] text-white placeholder:text-white/35 outline-none transition focus:border-[#3ddc97]/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#3ddc97]/10";
export const button =
  "mt-1 rounded-full bg-[#3ddc97] px-6 py-4 text-[17px] font-semibold text-[#04150d] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3ddc97]";

export function AuthCard({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className={`${sans.className} flex min-h-screen flex-col bg-[#05070b] px-4 py-8 text-white sm:px-8`}>
      <BrandMark />
      <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-12">
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em]">{title}</h1>
        {intro && <p className="mt-3 text-[16px] leading-7 text-white/60">{intro}</p>}
        {children}
        <p className="mt-8 text-center text-[15px] text-white/55">
          <Link href="/sign-in" className="font-semibold text-white underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
