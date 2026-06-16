import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Typography.
 *
 * Fonts are loaded via a <link> in the document head (below) and exposed to
 * the design system through the --font-heading / --font-body CSS variables in
 * globals.css, which Tailwind maps to font-heading / font-body. This avoids a
 * build-time network fetch (works offline / behind TLS-inspecting proxies).
 *
 * To swap typefaces later: change the Google Fonts <link> here and the two
 * font variables in globals.css -- no component edits required.
 */

export const metadata: Metadata = {
  title: "NeuroScan — Brain Tumor MRI Classification",
  description:
    "Premium educational demo classifying brain MRI scans with two real deep-learning models. Not a diagnostic tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen">
        {/* Persistent, always-visible medical disclaimer */}
        <DisclaimerBanner />
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
