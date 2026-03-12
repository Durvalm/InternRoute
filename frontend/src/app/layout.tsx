import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import MonitoringBootstrap from "@/components/MonitoringBootstrap";

export const metadata: Metadata = {
  title: "InternRoute",
  description: "Your internship prep cockpit"
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
