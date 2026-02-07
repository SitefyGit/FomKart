'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, fetchCreatorPosts, createCreatorPost, deleteCreatorPost, type CreatorPost } from '@/lib/supabase';
import { ShareModal } from '@/components/ShareModal';
import { ToastContainer, ToastItem } from '@/components/Toast';
import { SocialIconsBar } from '@/components/SocialIconsBar';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { 
  MapPinIcon, LinkIcon, ArrowTopRightOnSquareIcon, PlayCircleIcon, 
  PlusIcon, TrashIcon, XMarkIcon, PhotoIcon, ExclamationTriangleIcon,
  VideoCameraIcon, DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { Star, ExternalLink, ShoppingBag, MessageCircle, ChevronRight } from 'lucide-react';
import ShareIcon from '@mui/icons-material/Share';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  base_price?: number;
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
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
}

type VideoMeta = { provider: 'youtube' | 'vimeo'; id: string };

function extractVideoMeta(rawUrl: string): VideoMeta | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (youtubeMatch) return { provider: 'youtube', id: youtubeMatch[1] };
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) return { provider: 'vimeo', id: vimeoMatch[1] };
  return null;
}

function getEmbedUrl(meta: VideoMeta): string {
  return meta.provider === 'youtube'
    ? `https://www.youtube.com/embed/${meta.id}`
    : `https://player.vimeo.com/video/${meta.id}`;
}

const POST_IMAGE_BUCKET = 'creator-posts';

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const scale = MAX_WIDTH / img.width;
      
      if (scale >= 1) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
      }
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = reject;
  });
}

async function loadCreatorBio(username: string): Promise<{ creator: Creator; products: Product[]; posts: CreatorPost[] } | null> {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_creator', true)
      .single();
    if (error || !userData) return null;

    // Fetch featured products (or top 4 by rating)
    const { data: products } = await supabase
      .from('products')
      .select('id, title, description, images, base_price, rating, reviews_count, is_featured')
      .eq('creator_id', userData.id)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(4);

    // Fetch actual product ratings from reviews table
    const productIds = (products || []).map(p => p.id);
    const productRatingsMap = new Map<string, { rating: number; count: number }>();
    
    if (productIds.length > 0) {
      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .eq('is_public', true)
        .in('product_id', productIds)
        .not('rating', 'is', null);
      
      const totals = new Map<string, { sum: number; count: number }>();
      for (const row of (reviewRows || [])) {
        if (!row || !row.product_id) continue;
        const ratingValue = Number(row.rating);
        if (!Number.isFinite(ratingValue) || ratingValue <= 0) continue;
        const current = totals.get(row.product_id) ?? { sum: 0, count: 0 };
        current.sum += ratingValue;
        current.count += 1;
        totals.set(row.product_id, current);
      }
      
      for (const [productId, aggregate] of totals.entries()) {
        if (aggregate.count === 0) continue;
        const average = Math.round((aggregate.sum / aggregate.count) * 10) / 10;
        productRatingsMap.set(productId, { rating: average, count: aggregate.count });
      }
    }

    // Enrich products with actual ratings
    const enrichedProducts = (products || []).map(product => {
      const stats = productRatingsMap.get(product.id);
      return {
        ...product,
        rating: stats?.rating ?? product.rating ?? 0,
        reviews_count: stats?.count ?? product.reviews_count ?? 0,
      };
    });

    // Fetch recent posts
    const posts = await fetchCreatorPosts(userData.id);

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
        totalProducts: enrichedProducts.length,
      },
      products: enrichedProducts,
      posts: posts || [],
    };
  } catch {
    return null;
  }
}

export default function CreatorBioPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseAuthUser | null>(null);

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');

  // Add Link / Post State
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [postCaption, setPostCaption] = useState('');
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false,
    postId: null
  });

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (t: Omit<ToastItem, 'id'>) => setToasts((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...t }]);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      const data = await loadCreatorBio(username);
      if (data) {
        setCreator(data.creator);
        setProducts(data.products);
        setPosts(data.posts);
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

  const isOwner = !!(currentUser && creator && creator.id && currentUser.id === creator.id);

  // --- Post Handling ---
  const resetPostForm = () => {
    setPostType('text');
    setPostCaption('');
    setPostLinkUrl('');
    setPostVideoUrl('');
    setPostTags('');
    setPostImageFile(null);
    setPostImagePreview(null);
    setPostSubmitting(false);
    setAddLinkOpen(false);
  };

  const handlePostTypeSelection = (type: 'text' | 'image' | 'video') => {
    setPostType(type);
    setPostImageFile(null);
    setPostImagePreview(null);
    setPostVideoUrl('');
  };

  const handlePostImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      pushToast({ type: 'error', message: 'Image must be under 5MB' });
      return;
    }

    try {
      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      setPostImageFile(resizedFile);
      setPostImagePreview(URL.createObjectURL(resizedBlob));
    } catch (err) {
      pushToast({ type: 'error', message: 'Failed to process image' });
    }
  };

  const handlePostSubmit = async () => {
    if (!creator) return;
    if (!postCaption.trim() && postType === 'text') {
       pushToast({ type: 'error', message: 'Caption is required' });
       return;
    }
    
    setPostSubmitting(true);
    try {
      let mediaUrl = null;

      // Handle Image Upload
      if (postType === 'image' && postImageFile) {
        const fileExt = 'jpg';
        const fileName = `${creator.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from(POST_IMAGE_BUCKET)
          .upload(fileName, postImageFile, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from(POST_IMAGE_BUCKET)
          .getPublicUrl(fileName);
          
        mediaUrl = publicUrl;
      }

      // Prepare Post Data
      const newPost = {
        creator_id: creator.id,
        post_type: postType,
        caption: postCaption || null,
        link_url: postLinkUrl || null,
        media_url: mediaUrl || null,
        video_url: postType === 'video' ? (postVideoUrl || null) : null,
        tags: postTags ? postTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        is_public: true
      };

      const savedPost = await createCreatorPost(newPost);
      if (savedPost) {
        setPosts(prev => [savedPost, ...prev]);
        pushToast({ type: 'success', message: 'Post created successfully' });
        resetPostForm();
      } else {
        throw new Error('Failed to save post');
      }

    } catch (err) {
      console.error('Post creation error:', err);
      pushToast({ type: 'error', message: 'Failed to create post' });
    } finally {
      setPostSubmitting(false);
    }
  };

  // --- Deletion Handling ---
  const handleDeletePost = (postId: string) => {
    setDeleteConfirmation({ isOpen: true, postId });
  };

  const executeDelete = async () => {
    if (!deleteConfirmation.postId || !creator) return;
    
    try {
      const success = await deleteCreatorPost(creator.id, deleteConfirmation.postId);
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== deleteConfirmation.postId));
        pushToast({ type: 'success', message: 'Post deleted' });
      } else {
        pushToast({ type: 'error', message: 'Failed to delete post' });
      }
    } catch (err) {
      pushToast({ type: 'error', message: 'Error deleting post' });
    } finally {
      setDeleteConfirmation({ isOpen: false, postId: null });
    }
  };


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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Creator not found</h1>
          <Link href="/" className="text-emerald-600 hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 flex justify-center items-start">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Main Content - Centered Card */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-10 transition-all z-10">
        {/* Profile Info */}
        <div className="text-center mb-8">
          {/* Avatar */}
          <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-md">
            {creator.avatar_url ? (
              <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                {creator.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Verification */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{creator.full_name}</h1>
            {creator.is_verified && (
              <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
            )}
          </div>

          {/* Username */}
          <p className="text-gray-500 dark:text-gray-400 mb-3">@{creator.username}</p>

          {/* Bio */}
          {creator.bio && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{creator.bio}</p>
          )}

          {/* Social Icons */}
          {creator.social_links && Object.keys(creator.social_links).length > 0 && (
            <div className="flex justify-center mb-6">
              <SocialIconsBar links={creator.social_links} />
            </div>
          )}

          {/* Store / Bio Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
              <Link
                href={`/creator/${creator.username}`}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Store
                </span>
              </Link>
              <button
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Bio
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setShareOpen(true)}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            {!isOwner && (
              <button
                onClick={() => {
                  if (!currentUser) {
                    router.push(`/auth/login?redirect=/creator/${creator.username}/bio?contact=1`);
                    return;
                  }
                  setMessageOpen(true);
                }}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* View Store Button */}
        <Link
          href={`/creator/${creator.username}`}
          className="flex items-center justify-between w-full p-4 mb-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-semibold">View My Store</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-90">{creator.totalProducts} products</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        
        {/* Featured Products */}
        {products.length > 0 && (
          <div className="mb-6">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Featured
             </h2>
             <div className="space-y-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-600 transition-all group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 shrink-0">
                    {product.images && product.images[0] ? (
                      <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                       <span className="font-semibold text-emerald-600 dark:text-emerald-400">${product.base_price || 0}</span>
                       <span className="text-xs">•</span>
                       <span className="flex items-center gap-0.5 text-xs"><Star className="w-3 h-3 text-yellow-500" /> {product.rating?.toFixed(1) || 'New'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Links & Updates Section */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Links
                </h2>
                {isOwner && (
                    <button 
                       onClick={() => setAddLinkOpen(true)} 
                       className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium flex items-center gap-1"
                    >
                        <PlusIcon className="w-3 h-3" /> Add Post
                    </button>
                )}
            </div>

            {posts.length === 0 && (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                    <p>No links or updates yet.</p>
                </div>
            )}

            <div className="space-y-4">
              {posts.map((post) => {
                const isVideo = post.post_type === 'video';
                const isImage = post.post_type === 'image';
                const hasLink = !!post.link_url;
                const caption = (post.caption || '').trim();
                const title = caption.split('\n')[0].slice(0, 60) || (isVideo ? 'Watch video' : isImage ? 'View image' : 'View content');
                const videoMeta = isVideo && post.video_url ? extractVideoMeta(post.video_url) : null;

                return (
                  <div
                    key={post.id}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all overflow-hidden"
                  >
                    {isOwner && (
                         <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePost(post.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-20 tooltip"
                            title="Delete Link"
                         >
                            <TrashIcon className="w-4 h-4" />
                         </button>
                    )}

                    {/* Media Type Content */}
                    {isVideo && videoMeta && (
                      <div className="aspect-video bg-black rounded-t-xl overflow-hidden">
                        <iframe
                          src={getEmbedUrl(videoMeta)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {isImage && post.media_url && (
                       <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                        <Image src={post.media_url} alt={title} fill className="object-cover" />
                      </div>
                    )}

                    {/* Link or Text Content */}
                    {hasLink ? (
                        <a
                           href={post.link_url!}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="block p-4"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  {/* Icon based on content */}
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                      {isVideo ? <PlayCircleIcon className="w-5 h-5 text-gray-600" /> : 
                                       isImage ? <PhotoIcon className="w-5 h-5 text-gray-600" /> : 
                                       <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />} 
                                  </div>
                                  <div>
                                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{title}</p>
                                      {caption.length > 0 && caption !== title && (
                                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{caption}</p>
                                      )}
                                  </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                           </div>
                        </a>
                    ) : (
                        <div className="p-4">
                           <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                           {caption && caption !== title && <p className="text-sm text-gray-500 mt-1">{caption}</p>}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
        </div>

        {/* Subscribe & Footer */}
        {!isOwner && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                 <h3 className="font-medium text-gray-900 dark:text-white mb-3">Newsletter</h3>
                 {subscribeOpen ? (
                   <div className="flex gap-2">
                       <input 
                          type="email" 
                          placeholder="Your email" 
                          className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                          value={subscribeEmail}
                          onChange={e => setSubscribeEmail(e.target.value)}
                       />
                       <button onClick={handleSubscribe} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Join</button>
                   </div>
                 ) : (
                    <button onClick={() => setSubscribeOpen(true)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">Subscribe for updates</button>
                 )}
            </div>
        )}
        
        <div className="mt-6 text-center text-xs text-gray-400">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Powered by FomKart</Link>
        </div>

      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        username={creator.username}
        title={`Check out ${creator.full_name} on FomKart`}
      />
      
      {/* Message Modal */}
      {messageOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Message {creator.full_name}</h3>
                <textarea 
                   className="w-full border p-3 rounded-xl mb-4 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                   rows={4} 
                   placeholder="Type your message..."
                   value={messageBody}
                   onChange={e => setMessageBody(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                   <button onClick={() => setMessageOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                   <button onClick={handleSendMessage} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Send</button>
                </div>
             </div>
          </div>
      )}

      {/* Add Post Modal */}
      {addLinkOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Add New Post</h3>
              <button onClick={resetPostForm} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handlePostTypeSelection('text')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    postType === 'text'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DocumentTextIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">Text/Link</span>
                </button>
                <button
                  onClick={() => handlePostTypeSelection('image')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    postType === 'image'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PhotoIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">Image</span>
                </button>
                <button
                  onClick={() => handlePostTypeSelection('video')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    postType === 'video'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <VideoCameraIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">Video</span>
                </button>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4">
                {/* Image Upload */}
                {postType === 'image' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Upload Image
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {postImagePreview ? (
                        <div className="relative h-48 w-full">
                           <Image src={postImagePreview} alt="Preview" fill className="object-contain rounded-lg" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                              <p className="text-white font-medium">Change Image</p>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500">Click to upload image</p>
                          <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePostImageInput}
                    />
                  </div>
                )}

                {/* Video URL */}
                {postType === 'video' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Video URL (YouTube/Vimeo)
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={postVideoUrl}
                      onChange={(e) => setPostVideoUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                {/* Caption / Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {postType === 'text' ? 'Title / Message' : 'Caption'}
                  </label>
                  <textarea
                    rows={postType === 'text' ? 3 : 2}
                    placeholder={postType === 'text' ? "What's on your mind?" : "Add a caption..."}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                {/* Optional Link Payload */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex justify-between">
                       <span>Link URL (Optional)</span>
                    </label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={postLinkUrl}
                          onChange={(e) => setPostLinkUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="mt-6 shrink-0 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handlePostSubmit}
                disabled={postSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {postSubmitting ? (
                  <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Publishing...
                  </>
                ) : (
                  'Publish Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Post?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action cannot be undone. This post will be permanently removed from your profile.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, postId: null })}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
