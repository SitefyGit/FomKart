import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnnouncementBanner from '@/components/AnnouncementBanner'
import MaintenanceGuard from '@/components/MaintenanceGuard'
import Footer from '@/components/Footer'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import SiteHeader from '@/components/SiteHeader'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "FomKart - Professional Services Platform",
  description: "Connect with talented creators providing digital products, courses, and custom services",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="//picsum.photos" />
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <>
            <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin} crossOrigin="" />
            <link rel="dns-prefetch" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin} />
          </>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <CurrencyProvider>
        <LanguageProvider>
        <MaintenanceGuard>
        <AnnouncementBanner />
        <SiteHeader />
        <main className="min-h-[calc(100vh-theme(spacing.16))]">
          {children}
        </main>
        <Footer />
        </MaintenanceGuard>
        </LanguageProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
