import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "InternshipRoute",
  description: "Your internship prep cockpit"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
