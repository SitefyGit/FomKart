'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, ChevronDown, Search } from 'lucide-react';
import RouteProgress from '@/app/RouteProgress';
import NotificationsBell from '@/components/NotificationsBell';
import ProfileMenu from '@/components/ProfileMenu';
import CartIcon from '@/components/CartIcon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SiteHeader() {
  const { t, language, languages, setLanguage, showOriginalListings, setShowOriginalListings } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const currentLanguageObj = languages.find((l) => l.code === language) ?? languages[0];

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      router.push('/market');
      return;
    }

    const slug = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    router.push(`/market/${slug}`);
  };

  const isBioPage = pathname?.match(/^\/creator\/[^/]+\/bio$/);

  return (
    <>
      <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 ${isBioPage ? 'hidden md:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Desktop Layout using Grid for perfect alignment */}
          <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-x-6 items-center">
            {/* Logo */}
            <Link href="/" prefetch className="flex items-center shrink-0">
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

            {/* Desktop Search Bar */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSearch();
              }}
              className="w-full relative"
            >
              <div className="relative flex items-center overflow-hidden rounded-full border-2 border-emerald-500 dark:border-emerald-600 bg-white dark:bg-gray-900 shadow-sm focus-within:ring-4 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/30 transition-all">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for anything"
                  className="w-full bg-transparent pl-4 pr-16 py-2.5 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-500 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-0 flex items-center justify-center w-12 h-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4 shrink-0 justify-end">
              {language !== 'en' && (
                <button
                  type="button"
                  onClick={() => setShowOriginalListings(!showOriginalListings)}
                  className="hidden lg:inline-flex items-center text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showOriginalListings
                    ? t('viewTranslation', 'View translation')
                    : t('viewOriginal', 'View original')}
                </button>
              )}
              <div className="hidden lg:flex items-center gap-1 relative">
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
              <ThemeToggle />
              <CartIcon />
              <NotificationsBell />
              <ProfileMenu />
            </div>

            {/* Empty space for Grid Col 1 */}
            <div />
            
            {/* Desktop Navigation (Aligned precisely underneath the Search Bar) */}
            <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap pt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              <Link href="/market" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('explore', 'Explore')}
              </Link>
              <Link href="/category/digital-products" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('digitalProducts', 'Digital Products')}
              </Link>
              <Link href="/category/courses" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('courses', 'Courses')}
              </Link>
              <Link href="/category/services" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('services', 'Services')}
              </Link>
              <Link href="/category/consultation" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('consultations', 'Consultations')}
              </Link>
            </nav>
          </div>

          {/* Mobile Layout (unchanged logically, just adjusted for spacing since Grid took over Desktop) */}
          <div className="md:hidden flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" prefetch className="flex items-center shrink-0">
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
              <div className="flex items-center justify-end gap-2 shrink-0">
                <ThemeToggle />
                <CartIcon />
                <NotificationsBell />
                <ProfileMenu />
              </div>
            </div>
            
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSearch();
              }}
              className="w-full relative"
            >
              <div className="relative flex items-center overflow-hidden rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-900 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search over FomKart..."
                  className="w-full bg-transparent pl-4 pr-12 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-0 flex items-center justify-center w-10 h-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
            
            <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
              <Link href="/market" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('explore', 'Explore')}
              </Link>
              <Link href="/category/digital-products" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('digitalProducts', 'Digital Products')}
              </Link>
              <Link href="/category/courses" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('courses', 'Courses')}
              </Link>
              <Link href="/category/services" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('services', 'Services')}
              </Link>
              <Link href="/category/consultation" prefetch className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
                {t('consultations', 'Consultations')}
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <RouteProgress />
    </>
  );
}
