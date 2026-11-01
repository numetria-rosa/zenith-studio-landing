import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

/* Geist for text, Geist Mono for numbers, labels and statuses (the upload page design). */
export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${GeistSans.variable} ${GeistMono.variable} font-[family-name:var(--font-geist-sans)] leading-[1.3]`}>{children}</div>;
}
