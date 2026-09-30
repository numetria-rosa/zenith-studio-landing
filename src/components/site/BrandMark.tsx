import Link from "next/link";
import { fraunces } from "@/lib/fonts";

/** The one Zenith logo: icon plus a serif wordmark. "studio" reads ZENITH STUDIO; "lab" keeps the LAB badge. */
export function BrandMark({ brand = "studio", href = "/", size = "md" }: { brand?: "studio" | "lab"; href?: string; size?: "md" | "sm" }) {
  const icon = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <Link href={href} className="flex shrink-0 items-center gap-3 text-white no-underline" aria-label={brand === "lab" ? "Zenith Lab, home" : "Zenith Studio, home"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.webp" alt="" className={`${icon} rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]`} />
      <span className={`${fraunces.className} inline-flex items-center whitespace-nowrap font-bold tracking-tight ${size === "sm" ? "text-base" : "text-lg"}`}>
        {brand === "lab" ? (
          <>
            ZENITH
            <span className="ml-1 inline-flex items-center rounded-[4px] bg-gradient-to-r from-violet-500 to-blue-400 px-1.5 py-0.5 text-sm leading-none text-white">LAB</span>
          </>
        ) : (
          "ZENITH STUDIO"
        )}
      </span>
    </Link>
  );
}
