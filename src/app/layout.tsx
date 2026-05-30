import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Nav } from "@/components/nav";
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
  title: "ReviewPilot — Respond to every review in one click",
  description:
    "AI-powered review responses for Google My Business. Sound human every time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://reviewpilot.app"),
  robots: { index: true, follow: true },
  openGraph: {
    title: "ReviewPilot — Respond to every review in one click",
    description:
      "AI-powered review responses for Google My Business. Sound human every time.",
    type: "website",
    siteName: "ReviewPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReviewPilot — AI-powered review responses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot — Respond to every review in one click",
    description:
      "AI-powered review responses for Google My Business. Sound human every time.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
