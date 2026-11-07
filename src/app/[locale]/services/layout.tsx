// Inter, self-hosted (OFL-1.1, @fontsource/inter 5.3.0, latin): see src/lib/fraunces.ts for why not next/font/google.
import localFont from "next/font/local";

const inter = localFont({
  display: "swap",
  src: [
    { path: "../../../fonts/inter/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../fonts/inter/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../../fonts/inter/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../../fonts/inter/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../../fonts/inter/inter-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.className} antialiased`}>{children}</div>;
}
