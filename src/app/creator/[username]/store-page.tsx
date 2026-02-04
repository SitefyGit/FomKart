'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ReviewsSlider } from '@/components/ReviewsSlider';
import { ShareModal } from '@/components/ShareModal';
import { ToastContainer, ToastItem } from '@/components/Toast';
import { CreatorHeader, ProductCard, QuickActions, StoreFilters } from './components';
import { Search, Grid3X3, List, MessageCircle, Star, Package, ShoppingBag } from 'lucide-react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { MapPinIcon, LinkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { SocialIconsBar } from '@/components/SocialIconsBar';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface Product {
  id: string;
  title: string;
  description: string;
  created_at: string;
  images?: string[];
  videos?: string[];
  features?: string[];
  base_price?: number;
  rating?: number;
  reviews_count?: number;
  type?: 'product' | 'service';
  category_id?: string;
  delivery_time?: string;
  status?: string;
}

interface Creator {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  background_image?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  is_verified?: boolean;
  totalProducts: number;
  totalSales?: number;
  rating?: number;
  reviews_count?: number;
}

async function loadCreator(username: string): Promise<{ creator: Creator; products: Product[] } | null> {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_creator', true)
      .single();
    if (error || !userData) return null;

    const { data: products } = await supabase
      .from('products')
      .select('id, title, description, created_at, images, videos, features, base_price, rating, reviews_count, type, category_id, delivery_time, status')
      .eq('creator_id', userData.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    const productList = (products || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      created_at: p.created_at,
      images: p.images,
      videos: p.videos,
      features: p.features,
      base_price: p.base_price,
      rating: p.rating,
      reviews_count: p.reviews_count,
      type: p.type,
      category_id: p.category_id,
      delivery_time: p.delivery_time,
      status: p.status,
    }));

    // Get sales/review stats
    const { count: salesCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userData.id)
      .eq('status', 'completed');

    return {
      creator: {
        id: userData.id,
        username: userData.username,
        full_name: userData.full_name || userData.username,
        bio: userData.bio || '',
        avatar_url: userData.avatar_url,
        created_at: userData.created_at,
        background_image: userData.background_image,
        location: userData.location,
        website: userData.website,
        social_links: userData.social_links || {},
        is_verified: userData.is_verified,
        totalProducts: productList.length,
        totalSales: salesCount || 0,
        rating: userData.rating,
        reviews_count: userData.total_reviews,
      },
      products: productList,
    };
  } catch {
    return null;
  }
}

export default function CreatorStorePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseAuthUser | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [productType, setProductType] = useState<'all' | 'product' | 'service'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<{ url: string; title: string } | null>(null);

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (t: Omit<ToastItem, 'id'>) => setToasts((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...t }]);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      const data = await loadCreator(username);
      if (data) {
        setCreator(data.creator);
        setProducts(data.products);
      }
      setLoading(false);
    })();
  }, [username]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user || null);
    })();
  }, []);

  const isOwner = !!(currentUser && creator && currentUser.id === creator.id);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (productType !== 'all') {
      result = result.filter(p => p.type === productType);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return result;
  }, [products, searchTerm, productType, sortBy]);

  const handleSendMessage = async () => {
    if (!creator || !currentUser || !messageBody.trim()) return;
    try {
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: creator.id,
          type: 'message',
          title: `New message from ${currentUser.email?.split('@')[0] || 'User'}`,
          message: messageBody,
          data: { sender_id: currentUser.id, sender_email: currentUser.email }
        })
      });
      if (!response.ok) throw new Error('Failed to send');
      pushToast({ type: 'success', title: 'Message sent', message: 'Your message has been sent.' });
      setMessageBody('');
      setMessageOpen(false);
    } catch {
      pushToast({ type: 'error', title: 'Send failed', message: 'Could not send message.' });
    }
  };

  const handleSubscribe = async () => {
    if (!creator || !subscribeEmail.trim()) return;
    try {
      const { error } = await supabase.from('newsletter_subscriptions').insert({
        creator_id: creator.id,
        email: subscribeEmail.trim(),
      });
      if (error) throw error;
      pushToast({ type: 'success', title: 'Subscribed!', message: 'You\'ll receive updates from this creator.' });
      setSubscribeEmail('');
      setSubscribeOpen(false);
    } catch {
      pushToast({ type: 'error', title: 'Subscribe failed', message: 'Could not subscribe. Try again.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Creator not found</h1>
          <Link href="/" className="text-emerald-600 hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 ring-2 ring-white dark:ring-gray-800">
              {creator.avatar_url ? (
                <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                  {creator.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {creator.full_name}
                </h1>
                {creator.is_verified && (
                  <CheckBadgeIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {(creator.rating || 5).toFixed(1)}
                  <span className="text-gray-400">({creator.reviews_count || 0})</span>
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {creator.totalProducts} products
                </span>
                {creator.totalSales !== undefined && creator.totalSales > 0 && (
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" />
                    {creator.totalSales} sales
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/creator/${creator.username}/bio`}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                About Me
              </Link>
              {!isOwner && (
                <button
                  onClick={() => {
                    if (!currentUser) {
                      router.push(`/auth/login?redirect=/creator/${creator.username}?contact=1`);
                      return;
                    }
                    setMessageOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact
                </button>
              )}
              {isOwner && (
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            {/* About Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              {creator.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{creator.bio}</p>
              )}
              {creator.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPinIcon className="w-4 h-4" />
                  {creator.location}
                </div>
              )}
              {creator.website && (
                <a
                  href={creator.website.startsWith('http') ? creator.website : `https://${creator.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:underline mb-4"
                >
                  <LinkIcon className="w-4 h-4" />
                  {creator.website.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
              {creator.social_links && Object.keys(creator.social_links).length > 0 && (
                <SocialIconsBar links={creator.social_links} />
              )}
            </div>

            {/* Filter Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Filter by Type</h2>
              <div className="space-y-2">
                {(['all', 'product', 'service'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      productType === type
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type === 'all' ? 'All Products' : type === 'product' ? 'Digital Products' : 'Services'}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>

                {/* View Toggle */}
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Type Filter */}
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as 'all' | 'product' | 'service')}
                  className="lg:hidden px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="product">Digital Products</option>
                  <option value="service">Services</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </div>

            {/* Products */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || productType !== 'all'
                    ? 'No products match your filters.'
                    : 'No products available yet.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="grid"
                    showRating
                    onShare={(p) => setShareProduct({ url: `${window.location.origin}/product/${p.id}`, title: p.title })}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="list"
                    showRating
                    showDeliveryTime
                    onShare={(p) => setShareProduct({ url: `${window.location.origin}/product/${p.id}`, title: p.title })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Customer Reviews</h2>
          <ReviewsSlider creatorId={creator.id} />
        </div>
      </div>

      {/* Message Modal */}
      {messageOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Message {creator.full_name}
            </h3>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMessageOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageBody.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Product Modal */}
      {shareProduct && (
        <ShareModal
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          url={shareProduct.url}
          title={shareProduct.title}
        />
      )}
    </div>
  );
}
