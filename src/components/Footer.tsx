'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  MapPin,
  Phone,
  CreditCard,
  Globe,
  ShieldCheck
} from 'lucide-react'

export default function Footer() {
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
              />
              {/* Dark mode logo (white text) */}
              <Image 
                src="/fomkart_white_text.png" 
                alt="FomKart" 
                width={120} 
                height={32} 
                className="h-8 w-auto hidden dark:block"
              />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              The premier marketplace for digital creators. Sell products, courses, services, and consultations all in one place.
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
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Marketplace</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/market" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/category/digital-products" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Digital Products
                </Link>
              </li>
              <li>
                <Link href="/category/courses" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Online Courses
                </Link>
              </li>
              <li>
                <Link href="/category/services" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Offerings
                </Link>
              </li>
              <li>
                <Link href="/category/consultation" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Consultations
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">For Creators</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/start-selling" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/creator/onboarding" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                   Creator Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Stay Updated</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and creator tips.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                />
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              <button 
                type="button" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-500 dark:text-gray-500 text-sm">
              © {new Date().getFullYear()} FomKart. All rights reserved.
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Cookie Settings</Link>
              <Link href="/site-map" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sitemap</Link>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <Globe className="w-4 h-4" />
              <span className="text-sm">English (US)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
