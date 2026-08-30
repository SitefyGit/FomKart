'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  X, 
  Moon, 
  Sun, 
  Globe, 
  ChevronRight, 
  ChevronDown, 
  ShoppingCart, 
  Bell, 
  MessageCircle, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Video, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Store, 
  Wallet, 
  Settings, 
  Package, 
  HelpCircle, 
  ShieldCheck, 
  FileText,
  Compass
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, language, languages, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const currentLanguageObj = languages.find((l) => l.code === language) ?? languages[0];
  const isDark = resolvedTheme === 'dark';

  // Close drawer only when pathname genuinely changes
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);

    const fetchUserData = async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        setCartCount(0);
        setUnreadNotifications(0);
        setUnreadMessages(0);
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setUser(data || authUser);

        // Fetch unread notifications
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('is_read', false);
        setUnreadNotifications(notifCount || 0);

        // Fetch unread messages
        const { count: msgCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('type', 'direct_message')
          .eq('is_read', false);
        setUnreadMessages(msgCount || 0);

        // Fetch cart count
        const { count: cCount } = await supabase
          .from('carts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);
        setCartCount(cCount || 0);
      } catch (err) {
        console.error('Error fetching user for drawer:', err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      fetchUserData(authUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = user
    ? user.full_name || user.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    : '';
  const avatar = user
    ? user.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
    : null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-[101] overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Link href="/" onClick={onClose} className="flex items-center">
            <Image
              src="/fomkart_green_text.png"
              alt="fomkart"
              width={82}
              height={22}
              className="h-5.5 w-auto dark:hidden"
              priority
              suppressHydrationWarning
            />
            <Image
              src="/fomkart_white_text.png"
              alt="fomkart"
              width={82}
              height={22}
              className="h-5.5 w-auto hidden dark:block"
              priority
              suppressHydrationWarning
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4 space-y-6">
          {/* User Auth Section */}
          {user ? (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-3 mb-3">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt={displayName} className="w-11 h-11 rounded-full object-cover shrink-0 border border-emerald-500" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white truncate text-base">{displayName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                </div>
              </div>

              {/* User Quick Links */}
              <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                {user.is_creator && (
                  <>
                    <Link
                      href={`/creator/${user.username}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Store className="w-4 h-4 text-emerald-600" />
                        My Store
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      href="/orders?tab=selling"
                      onClick={onClose}
                      className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        Creator Dashboard
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      href="/profile/wallet"
                      onClick={onClose}
                      className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        My Wallet
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </>
                )}
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-gray-500" />
                    My Orders
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/messages"
                  onClick={onClose}
                  className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                    Messages
                  </span>
                  {unreadMessages > 0 ? (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadMessages}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center justify-between px-2.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-gray-500" />
                    Account Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-center">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2.5">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">Welcome to fomkart</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3.5">
                Join our marketplace to buy, sell, and connect with creators.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="py-2 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium text-xs hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/choose-role"
                  onClick={onClose}
                  className="py-2 px-3 bg-emerald-600 text-white rounded-xl font-medium text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}

          {/* Quick Preferences: Cart, Theme & Language */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Shortcuts & Settings
            </p>

            {/* Cart Link */}
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Shopping Cart</span>
              </span>
              {cartCount > 0 ? (
                <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </Link>

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 transition-colors"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>
            )}

            {/* Language Selector Accordion */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Language</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold uppercase">{currentLanguageObj.code}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${languageOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {languageOpen && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageOpen(false);
                      }}
                      className={`text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between ${
                        lang.code === language
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{lang.nativeName}</span>
                      <span className="text-[10px] text-gray-400 uppercase shrink-0">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Browse Categories Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Explore Categories
            </p>
            <div className="space-y-1">
              <Link
                href="/market"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-indigo-500" />
                  {t('explore', 'Explore Market')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/category/offerings"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  {t('allOfferings', 'All Offerings')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/category/digital-products"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-blue-500" />
                  {t('digitalProducts', 'Digital Products')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/category/courses"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  {t('courses', 'Online Courses')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/category/services"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-500" />
                  {t('services', 'Services')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/category/consultation"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-rose-500" />
                  {t('consultations', 'Consultations')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Become a Creator CTA if not creator */}
          {(!user || !user.is_creator) && (
            <div className="p-4 bg-emerald-600 rounded-2xl text-white text-center">
              <h4 className="font-bold text-sm mb-1">Start Selling on fomkart</h4>
              <p className="text-xs text-emerald-100 mb-3">
                Offer your products, services, or courses to thousands of buyers.
              </p>
              <Link
                href="/auth/creator-signup"
                onClick={onClose}
                className="inline-block w-full py-2 bg-white text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-50 transition-colors"
              >
                Become a Creator
              </Link>
            </div>
          )}

          {/* Support & Links */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/help" onClick={onClose} className="hover:text-emerald-600">Help Center</Link>
              <Link href="/terms" onClick={onClose} className="hover:text-emerald-600">Terms</Link>
              <Link href="/privacy" onClick={onClose} className="hover:text-emerald-600">Privacy</Link>
              <Link href="/site-map" onClick={onClose} className="hover:text-emerald-600">Sitemap</Link>
            </div>
            {user && (
              <button
                onClick={async () => {
                  onClose();
                  await supabase.auth.signOut();
                  location.href = '/';
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl font-medium text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
