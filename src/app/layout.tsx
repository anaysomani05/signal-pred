import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "signal",
  description: "Prediction markets from Kalshi and Polymarket.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F0EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
