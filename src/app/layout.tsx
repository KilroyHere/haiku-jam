import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth-provider";

import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://morrow-poetry.vercel.app",
  ),
  title: {
    default: "Morrow — Three voices, one small poem",
    template: "%s · Morrow",
  },
  description:
    "Begin a three-line poem, carry a stranger’s words forward, or complete a tiny collaboration.",
  applicationName: "Morrow",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Morrow",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Morrow",
    title: "Morrow — Three voices, one small poem",
    description: "Collaborative poetry, passed hand to hand.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F2E8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${serif.variable}`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
