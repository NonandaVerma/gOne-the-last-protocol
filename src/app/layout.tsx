import type { Metadata, Viewport } from "next";
import { Orbitron, Rajdhani, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/**
 * TYPOGRAPHY — "Order vs Entropy" sci-fi system.
 *
 * Orbitron  : angular geometric display face. Logo lockups, screen titles.
 * Rajdhani  : condensed technical sans. Buttons, HUD, labels, system text.
 * Inter     : neutral body face. Descriptions, narrative copy, long form.
 *
 * Replaces the previous Cinzel / Cinzel Decorative / Cormorant Garamond
 * stack, which read as Roman-Renaissance fantasy and fought the metallic
 * sci-fi logo in the teaser key art.
 */
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "G-ONE: THE LAST PROTOCOL",
  description:
    "Reality is fracturing. A cosmic war between Order and Entropy — cyan protocol against crimson corruption across six collapsing realms.",
};

export const viewport: Viewport = {
  themeColor: "#070A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${rajdhani.variable} ${inter.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-obsidian text-paper antialiased overflow-hidden min-h-screen font-body select-none"
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
