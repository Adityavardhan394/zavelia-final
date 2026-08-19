import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZAVÉLIA — Jewellery, Beauty & Accessories",
  description:
    "Curated jewellery, beauty and fashion accessories for every version of you. Shop everyday glow, ritual beauty and statement accessories.",
  keywords: [
    "ZAVÉLIA",
    "jewellery",
    "beauty",
    "accessories",
    "fashion",
    "Indian jewellery",
    "skincare",
    "hair accessories",
    "gifting",
  ],
  authors: [{ name: "ZAVÉLIA" }],
  creator: "ZAVÉLIA",
  publisher: "ZAVÉLIA",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://zavelia.com",
  ),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "ZAVÉLIA",
    title: "ZAVÉLIA — Jewellery, Beauty & Accessories",
    description:
      "Curated jewellery, beauty and fashion accessories for every version of you.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZAVÉLIA — Jewellery, Beauty & Accessories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZAVÉLIA — Jewellery, Beauty & Accessories",
    description:
      "Curated jewellery, beauty and fashion accessories for every version of you.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  category: "e-commerce",
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
      </body>
    </html>
  );
}
