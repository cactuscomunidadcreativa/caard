/**
 * CAARD - Root Layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AntiCopy } from "@/components/anti-copy";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CAARD - Sistema de Arbitraje",
    template: "%s | CAARD",
  },
  description:
    "Sistema Integral de Control de Arbitrajes y Resolución de Disputas",
  keywords: ["arbitraje", "disputas", "legal", "casos", "expedientes"],
  authors: [{ name: "CAARD" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased overflow-x-hidden`}
      >
        <Providers>
          <AntiCopy />
          {children}
        </Providers>
      </body>
    </html>
  );
}
