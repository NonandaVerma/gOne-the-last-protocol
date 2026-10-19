import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  display: "swap",
  weight: ["700", "900"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "G-ONE: THE LAST PROTOCOL",
  description: "A mythological dark-fantasy action platformer. Greek divine guardian vs Viking destroyer. Two forces. Three arenas. One final protocol.",
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
      className={`${cinzelDecorative.variable} ${cinzel.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#03060d] text-slate-100 antialiased overflow-hidden min-h-screen font-inter select-none"
      >
        {children}
      </body>
    </html>
  );
}
