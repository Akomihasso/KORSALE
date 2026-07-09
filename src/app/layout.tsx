import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "KORSALE",
    template: "%s — KORSALE",
  },
  description: "Kordinat Satış & Operasyon Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <RouteProgress />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
