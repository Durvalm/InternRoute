import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import MonitoringBootstrap from "@/components/MonitoringBootstrap";

const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
const APP_URL = rawAppUrl || "https://app.internroute.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "InternRoute",
    template: "%s | InternRoute",
  },
  description: "A platform to help students become internship-ready for software engineering roles.",
  applicationName: "InternRoute",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "InternRoute",
    title: "InternRoute",
    description: "Learn how to get a SWE internship with roadmap guidance, coding practice, projects, applications, and interview prep.",
    images: [
      {
        url: "/og-dashboard.png",
        width: 1200,
        height: 630,
        alt: "InternRoute dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InternRoute",
    description: "Learn how to get a SWE internship with roadmap guidance, coding practice, projects, applications, and interview prep.",
    images: ["/twitter-dashboard.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sentryEnabled = (process.env.NEXT_PUBLIC_SENTRY_DSN || "").trim().length > 0;

  return (
    <html lang="en">
      <body className="font-sans">
        {sentryEnabled ? (
          <Script
            src="https://browser.sentry-cdn.com/8.31.0/bundle.tracing.replay.min.js"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
        <MonitoringBootstrap />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
