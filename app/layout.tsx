import type { Metadata } from "next";
import { Geist_Mono, Red_Hat_Text, Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Use Red Hat Text as the primary sans-serif font across the site
// Available weights for Red Hat Text in next/font: 300, 400, 500, 600, 700 (and "variable")
const redHatText = Red_Hat_Text({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Optionally expose Red Hat Display for headings via a CSS variable if needed later
const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroCode",
  description: "Next Level AI-Powered Documentation & Onboarding for Developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${redHatText.variable} ${redHatDisplay.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
