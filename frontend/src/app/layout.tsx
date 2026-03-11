import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import MonitoringBootstrap from "@/components/MonitoringBootstrap";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  preload: false,
});

export const metadata: Metadata = {
  title: "InternshipRoute",
  description: "Your internship prep cockpit"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sentryEnabled = (process.env.NEXT_PUBLIC_SENTRY_DSN || "").trim().length > 0;

  return (
    <html lang="en" className={spaceGrotesk.variable}>
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
