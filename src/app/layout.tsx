import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RouteProgress from './RouteProgress'
import NotificationsBell from '../components/NotificationsBell'
import AuthButton from '../components/AuthButton'
import ProfileMenu from '../components/ProfileMenu'

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
  description: "Connect with talented creators offering digital products, courses, and custom services",
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
        {/* Global Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" prefetch className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">F</div>
                <span className="font-semibold text-gray-900 dark:text-white">FomKart</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/gigs" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Explore</Link>
              <Link href="/category/digital-products" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Digital Products</Link>
              <Link href="/category/courses" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Courses</Link>
              <Link href="/category/services" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Services</Link>
              <Link href="/orders" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">Orders</Link>
              <AuthButton />
              </nav>
            </div>
            {/* Right actions always visible */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <NotificationsBell />
              <ProfileMenu />
            </div>
          </div>
        </header>
  <RouteProgress />
        {children}
      </body>
    </html>
  );
}
