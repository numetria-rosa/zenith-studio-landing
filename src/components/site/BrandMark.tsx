import Link from "next/link";
import { wordmark } from "@/lib/fonts";

/** The one Zenith logo: the Z mark plus the Unbounded wordmark. "studio" reads Zenith Studio; "lab" reads Zenith + a LAB badge. */
export function BrandMark({ brand = "studio", href = "/", size = "md" }: { brand?: "studio" | "lab"; href?: string; size?: "md" | "sm" }) {
  return (
    <Link href={href} className="flex shrink-0 items-center text-white no-underline" aria-label={brand === "lab" ? "Zenith Lab, home" : "Zenith Studio, home"}>
      <BrandLockup brand={brand} size={size} />
    </Link>
  );
}

/** Same logo without the link, for sidebars and headers that already sit inside their own link or none. */
export function BrandLockup({ brand = "studio", size = "md" }: { brand?: "studio" | "lab"; size?: "md" | "sm" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/zenith-mark.png" alt="" className={size === "sm" ? "h-7 w-7" : "h-9 w-9"} />
      <span className={`${wordmark.className} inline-flex items-center whitespace-nowrap font-semibold tracking-[-0.01em] ${size === "sm" ? "text-[14px]" : "text-[16px]"}`}>
        {brand === "lab" ? (
          <>
            Zenith
            <span className="ml-1.5 inline-flex items-center rounded-[4px] bg-gradient-to-r from-violet-500 to-blue-400 px-1.5 py-0.5 text-[0.7em] leading-none text-white">LAB</span>
          </>
        ) : (
          "Zenith Studio"
        )}
      </span>
    </span>
  );
}
