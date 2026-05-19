import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevLooper — AI Sales Rep for Solo Founders & Small Teams",
  description:
    "Automate lead sourcing, personalized outreach, follow-up, and meeting booking. RevLooper is the AI-native outreach platform for solo founders and small B2B teams.",
  metadataBase: new URL("https://revlooper.com"),
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "RevLooper — AI Sales Rep",
    description:
      "From lead import to meeting booked in under 10 minutes. RevLooper runs your outreach on autopilot.",
    url: "https://revlooper.com",
    siteName: "RevLooper",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
