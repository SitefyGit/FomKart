'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import RouteProgress from '@/app/RouteProgress';
import NotificationsBell from '@/components/NotificationsBell';
import AuthButton from '@/components/AuthButton';
import ProfileMenu from '@/components/ProfileMenu';
import CartIcon from '@/components/CartIcon';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SiteHeader() {
  const { t, language, languages, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const currentLanguageObj = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" prefetch className="flex items-center">
              <Image
                src="/fomkart_green_text.png"
                alt="FomKart"
                width={90}
                height={24}
                className="h-6 w-auto dark:hidden"
                priority
                suppressHydrationWarning
              />
              <Image
                src="/fomkart_white_text.png"
                alt="FomKart"
                width={90}
                height={24}
                className="h-6 w-auto hidden dark:block"
                priority
                suppressHydrationWarning
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/market" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('explore', 'Explore')}</Link>
              <Link href="/category/digital-products" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('digitalProducts', 'Digital Products')}</Link>
              <Link href="/category/courses" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('courses', 'Courses')}</Link>
              <Link href="/category/services" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('services', 'Services')}</Link>
              <Link href="/category/consultation" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('consultations', 'Consultations')}</Link>
              <Link href="/orders" prefetch className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">{t('orders', 'Orders')}</Link>
              <AuthButton />
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <div className="hidden md:flex items-center gap-1 relative">
              <button
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLanguageObj.code.toUpperCase()}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
              </button>
              {languageOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLanguageOpen(false)} />
                  <div className="absolute right-0 top-8 z-50 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('selectLanguage', 'Select Language')}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setLanguageOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${
                            lang.code === language
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span>{lang.nativeName}</span>
                          <span className="text-xs text-gray-400 uppercase">{lang.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <CartIcon />
            <NotificationsBell />
            <ProfileMenu />
          </div>
        </div>
      </header>
      <RouteProgress />
    </>
  );
}
