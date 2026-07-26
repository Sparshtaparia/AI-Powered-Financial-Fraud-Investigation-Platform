import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TRINETRA — Command Intelligence",
    template: "%s | TRINETRA"
  },
  description: "AI-driven parking intelligence detecting illegal parking hotspots and their congestion impact on Bengaluru traffic. Targeted enforcement for BTP GridLock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${space.variable} bg-warm-cream text-text-primary font-body antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
