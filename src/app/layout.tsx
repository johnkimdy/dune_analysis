import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/layout/NavBar";
import { I18nProvider } from "@/lib/i18n";
import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import { LandingScrollProvider } from "@/contexts/LandingScrollContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "thestablecoinmustflow. | Dune Dashboard",
  description:
    "Real-time tracking of USDC, USDT, DAI, BUSD, TUSD, FRAX flows in and out of Korean crypto exchanges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <I18nProvider>
          <DashboardDataProvider>
            <LandingScrollProvider>
              <NavBar />
              {children}
            </LandingScrollProvider>
          </DashboardDataProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
