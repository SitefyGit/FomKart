'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const { currency, currencies, setCurrency } = useCurrency()
  const { language, languages, setLanguage, t, showOriginalListings, setShowOriginalListings } = useLanguage()
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const currentCurrencyObj = currencies.find(c => c.code === currency) ?? currencies[0]
  const currentLanguageObj = languages.find(l => l.code === language) ?? languages[0]
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              {/* Light mode logo (green text) */}
              <Image 
                src="/fomkart_green_text.png" 
                alt="FomKart" 
                width={120} 
                height={32} 
                className="h-8 w-auto dark:hidden"
                suppressHydrationWarning
              />
              {/* Dark mode logo (white text) */}
              <Image 
                src="/fomkart_white_text.png" 
                alt="FomKart" 
                width={120} 
                height={32} 
                className="h-8 w-auto hidden dark:block"
                suppressHydrationWarning
              />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t('marketplaceDescription', 'The premier marketplace for digital creators. Sell products, courses, services, and consultations all in one place.')}
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t('marketplace', 'Marketplace')}</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/market" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('allProducts', 'All Products')}
                </Link>
              </li>
              <li>
                <Link href="/category/digital-products" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('digitalProducts', 'Digital Products')}
                </Link>
              </li>
              <li>
                <Link href="/category/courses" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('onlineCourses', 'Online Courses')}
                </Link>
              </li>
              <li>
                <Link href="/category/services" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('services', 'Services')}
                </Link>
              </li>
              <li>
                <Link href="/category/consultation" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('consultations', 'Consultations')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t('forCreators', 'For Creators')}</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/auth/creator-signup" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('startSelling', 'Start Selling')}
                </Link>
              </li>
              <li>
                <Link href="/orders?tab=selling" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('creatorDashboard', 'Creator Dashboard')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  {t('successStories', 'Success Stories')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                   {t('creatorCommunity', 'Creator Community')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t('stayUpdated', 'Stay Updated')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('newsletterDescription', 'Subscribe to our newsletter for the latest updates and creator tips.')}
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder={t('enterYourEmail', 'Enter your email')} 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                />
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              <button 
                type="button" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {t('subscribe', 'Subscribe')}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-500 dark:text-gray-500 text-sm">
              © {new Date().getFullYear()} FomKart. {t('allRightsReserved', 'All rights reserved.')}
            </div>

            {language !== 'en' && (
              <button
                type="button"
                onClick={() => setShowOriginalListings(!showOriginalListings)}
                className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showOriginalListings
                  ? t('viewTranslation', 'View translation')
                  : t('viewOriginal', 'View original')}
              </button>
            )}
            
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('privacyPolicy', 'Privacy Policy')}</Link>
              <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('termsOfService', 'Terms of Service')}</Link>
              <Link href="/cookies" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('cookieSettings', 'Cookie Settings')}</Link>
              <Link href="/site-map" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t('sitemap', 'Sitemap')}</Link>
              <a href="mailto:parvesh@sitefy.co" className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800">
                <Mail className="w-4 h-4" />
                {t('feedbackToFounder', 'Give Feedback to Founder')}
              </a>
            </div>

            <div className="flex items-center gap-5 text-gray-400 relative">
              <div className="flex items-center gap-2 relative">
                <Globe className="w-4 h-4" />
                <button
                  onClick={() => {
                    setCurrencyOpen(false)
                    setLanguageOpen(o => !o)
                  }}
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  aria-label="Select language"
                >
                  <span>{currentLanguageObj.code.toUpperCase()}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
                </button>
                {languageOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLanguageOpen(false)} />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 z-50 w-[85vw] max-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {t('selectLanguage', 'Select Language')}
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setLanguageOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                              lang.code === language
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span>{lang.nativeName}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">{lang.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 relative">
              <Globe className="w-4 h-4" />
              <button
                onClick={() => {
                  setLanguageOpen(false)
                  setCurrencyOpen(o => !o)
                }}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                aria-label="Select currency"
              >
                <span>{currentCurrencyObj.symbol}</span>
                <span>{currentCurrencyObj.code}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {currencyOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 z-50 w-[85vw] max-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('selectCurrency', 'Select Currency')}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {currencies.map(cur => (
                        <button
                          key={cur.code}
                          onClick={() => { setCurrency(cur.code); setCurrencyOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                            cur.code === currency
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-8 text-center font-mono text-xs text-gray-500 dark:text-gray-400">{cur.symbol}</span>
                            <span>{cur.name}</span>
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{cur.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
