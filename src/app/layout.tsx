import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://zenith-studio.site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zenith Studio | AI Automation Agency for Small Business",
    template: "%s | Zenith Studio",
  },
  description:
    "We build done-for-you AI automation systems that capture leads, book appointments, and clear your inbox. AI receptionists, lead follow-up, and custom integrations. Live in 7 days, from $800.",
  keywords: [
    "AI automation agency",
    "AI automation for small business",
    "AI receptionist for small business",
    "automated lead follow up system",
    "AI lead capture system",
    "AI appointment booking system",
    "done for you AI automation",
    "workflow automation agency",
    "business process automation services",
    "custom AI integration",
  ],
  authors: [{ name: "Zenith Studio", url: SITE_URL }],
  creator: "Zenith Studio",
  publisher: "Zenith Studio",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Zenith Studio",
    title: "Zenith Studio | AI Automation Agency for Small Business",
    description:
      "Done-for-you AI automation that captures leads, books appointments, and clears your inbox. Live in 7 days, from $800.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenith Studio | AI Automation Agency for Small Business",
    description:
      "Done-for-you AI automation that captures leads, books appointments, and clears your inbox. Live in 7 days, from $800.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "icon",
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <MetaPixel />
      </body>
    </html>
  );
}
