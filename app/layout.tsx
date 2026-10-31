import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Nav from "@/components/Nav";
import Welcome from "@/components/Welcome";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GetPaid Copilot",
  description: "An AI agent that drafts and chases PayPal invoices. You approve every send.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          <Nav />
          <Welcome />
          {children}
          <footer className="pb-8 pt-2 text-center text-xs text-slate-400">
            Built with the PayPal Invoicing API (sandbox) · Gemini function calling · AG Grid · Next.js
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}