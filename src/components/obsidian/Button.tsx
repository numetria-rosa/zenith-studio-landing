import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

// The design's glass buttons are `height: Npx` plus a 1px border under content-box sizing,
// so they render 2px taller than the Frost primary at the same size.
const SIZES = {
  primary: { nav: "h-11 px-5 text-[15px]", lg: "h-[52px] px-[26px] text-[16px]", xl: "h-[54px] px-[30px] text-[16px]" },
  glass: { nav: "h-[46px] px-5 text-[15px]", lg: "h-[54px] px-[26px] text-[16px]", xl: "h-[56px] px-[30px] text-[16px]" },
} as const;

/** Primary = solid Frost pill. Glass = the standard secondary pill. Always a real anchor. */
export function Button({
  href,
  variant = "primary",
  size = "lg",
  arrow = false,
  children,
}: {
  href: string;
  variant?: "primary" | "glass";
  size?: keyof typeof SIZES.primary;
  arrow?: boolean;
  children: ReactNode;
}) {
  const look =
    variant === "primary"
      ? "bg-frost text-void hover:bg-white"
      : "glass text-frost hover:bg-white/[0.07]";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full font-medium no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-text ${SIZES[variant][size]} ${look}`}
    >
      {children}
      {arrow && <Icon name="arrow" size={18} color="#05060A" strokeWidth={2} />}
    </Link>
  );
}
