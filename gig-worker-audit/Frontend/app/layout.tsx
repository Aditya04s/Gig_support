import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

// Initialize the Inter font for a clean, modern aesthetic
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gig Worker Rights Verification System",
  description: "AI-powered fairness audit for gig workers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col antialiased`}>
        {/* Persistent Header Component */}
        <Header />
        
        {/* Main Content Area */}
        <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}