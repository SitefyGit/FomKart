// CLEAN REWRITE (corruption removed)
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// Icons (Heroicons + MUI)
import { UserCircleIcon, MapPinIcon, LinkIcon, ArrowTopRightOnSquareIcon, PlayCircleIcon, ChatBubbleLeftRightIcon, CameraIcon } from '@heroicons/react/24/outline';
import ShareIcon from '@mui/icons-material/Share';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import StarIcon from '@mui/icons-material/StarOutline';
import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import { ReviewsSlider } from '@/components/ReviewsSlider';
import { SocialIconsBar } from '@/components/SocialIconsBar';
import { ToastContainer, ToastItem } from '@/components/Toast';
import { ShareModal } from '@/components/ShareModal';

interface Product {
  id: string;
  title: string;
  description: string;
  created_at: string;
  images?: string[];
  videos?: string[];
  features?: string[];
  base_price?: number;
  auto_message_enabled?: boolean;
  auto_message?: string | null;
}
interface Creator {
  id: string; username: string; full_name: string; bio?: string; avatar_url?: string; created_at: string;
  background_image?: string; products: Product[]; totalProducts: number;
  location?: string; website?: string; social_links?: Record<string, string>;
  followers?: number; following?: number;
}

async function loadCreator(username: string): Promise<Creator | null> {
  try {
    const { data: userData, error } = await supabase
      .from("users").select("*")
      .eq("username", username)
      .eq("is_creator", true)
      .single();
    if (error || !userData) return null;
    const { data: products } = await supabase
      .from("products")
      .select("id,title,description,created_at,images,videos,features,base_price")
      .eq("creator_id", userData.id)
      .order("created_at", { ascending: false });
    const productList = (products || []).map(p => ({ id: p.id, title: p.title, description: p.description, created_at: p.created_at, images: p.images, videos: p.videos, features: p.features, base_price: p.base_price }));
    if (productList.length === 0) {
      // Dummy products fallback
      for (let i=1;i<=3;i++) {
        productList.push({
          id: `dummy-${i}`,
          title: `Sample Product ${i}`,
          description: `This is a placeholder description for sample product ${i}. Replace by adding a real product.`,
          created_at: new Date(Date.now()- i*86400000).toISOString(),
          images: [],
          videos: [],
          features: ['Feature A','Feature B'].slice(0,i),
          base_price: i*10 + 9
        });
      }
    }
    return {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name || userData.username,
      bio: userData.bio || "Creative professional.",
      avatar_url: userData.avatar_url,
      created_at: userData.created_at,
      background_image: userData.background_image,
      location: userData.location,
      website: userData.website,
      social_links: userData.social_links || {},
    followers: 0,
    following: 0,
  products: productList,
    totalProducts: productList.length
    };
  } catch { return null; }
}

// Image helpers: resize client-side for faster uploads
async function resizeImage(file: File, maxWidth: number, maxHeight: number, mime = 'image/webp', quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
    const targetW = Math.round(width * ratio)
    const targetH = Math.round(height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), mime, quality))
  } catch {
    return file
  }
}

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // 'avatar' | 'cover'
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shareOpen, setShareOpen] = useState(false); // State for Share Modal
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; type: 'product' | 'review' | 'post'; created_at: string; title: string; extra?: string; tags?: string[]; link?: string; videoId?: string }>>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '' });
  // Extra dynamic product fields (gig style)
  const [productExtras, setProductExtras] = useState({
    videoUrl: '',
    externalUrl: '',
    tags: '',
    fileFormat: '',
    downloadUrl: '',
    fileSize: '',
    licenseType: '',
    consultationDuration: '', // minutes
    consultationMethod: '',
    consultationAvailability: '',
    courseModules: '',
    courseHours: '',
    courseCurriculum: '',
    courseLevel: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [addPostOpen, setAddPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostLink, setNewPostLink] = useState('');
  const [newPostVideo, setNewPostVideo] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (t: Omit<ToastItem, 'id'>) => setToasts((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...t }]);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    bio: '',
    website: '',
    location: '',
    twitter: '',
    instagram: '',
    youtube: '',
    facebook: '',
    linkedin: ''
  });
  // Product share modal
  const [shareProduct, setShareProduct] = useState<{ url: string; title: string } | null>(null);
  const productTypes = [
    { key: 'digital', label: 'Digital Product', desc: 'Checklist, guide, e-book, protected videos, etc.' },
    { key: 'consultation', label: 'Consultation', desc: 'Book a consultation, webinar, lecture, etc.' },
    { key: 'course', label: 'Course', desc: 'Training program with embedded lessons' }
  ];
  const [selectedType, setSelectedType] = useState('digital');
  // New: support multiple product images in a gallery
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');

  async function handleImageUpload(file: File, type: 'avatar' | 'cover') {
    if (!creator) return;
    try {
      setUpdating(type);
      // Resize for faster upload & smaller storage
      const resized = await resizeImage(
        file,
        type === 'avatar' ? 512 : 1920,
        type === 'avatar' ? 512 : 600,
        'image/webp',
        0.85
      )
      const fileExt = 'webp';
      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2,8);
      const path = `${creator.id}/${type}-${stamp}-${rand}.${fileExt}`; // cache-busting unique name
      const activeBucket = type === 'avatar' ? 'avatars' : 'covers';
      // Optimistic UI preview
      const localUrl = URL.createObjectURL(file)
      setCreator(prev => prev ? { ...prev, ...(type === 'avatar' ? { avatar_url: localUrl } : { background_image: localUrl }) } : prev)

      // Upload (upsert true, with cache control & content type)
      const { error: uploadError } = await supabase.storage
        .from(activeBucket)
        .upload(path, resized, { upsert: true, cacheControl: '3600', contentType: 'image/webp' })
      if (uploadError) {
        console.warn('Upload failed; bucket missing or permission issue:', uploadError.message);
        alert(`Upload failed: create a public storage bucket named "${activeBucket}" and ensure its policy allows inserts for authenticated users.`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from(activeBucket).getPublicUrl(path);
      const url = `${publicUrlData.publicUrl}?v=${stamp}`; // add query param to bust CDN cache after replacement
      const updates: any = type === 'avatar' ? { avatar_url: url } : { background_image: url };
      const prevUrl = type === 'avatar' ? creator.avatar_url : creator.background_image;
      const { error: updateError } = await supabase.from('users').update(updates).eq('id', creator.id);
      if (updateError) throw updateError;
      setCreator(prev => prev ? { ...prev, ...updates } : prev);
      pushToast({ type: 'success', title: 'Profile updated', message: `${type==='avatar'?'Profile photo':'Cover photo'} updated successfully!` });

      // Try deleting old file to save storage (ignore errors)
      if (prevUrl && prevUrl.includes('/storage/v1/object/public/')) {
        const match = prevUrl.replace(/\?.*$/, '').match(/\/storage\/v1\/object\/public\/(.*?)\/(.*)$/);
        if (match) {
          const [, bucket, key] = match;
          await supabase.storage.from(bucket).remove([key]);
        }
      }
    } catch (e:any) {
      console.error('Upload failed', e);
      alert(`Failed to upload image: ${e?.message||'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  }

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, type);
  }

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      setCreator(await loadCreator(username));
      setLoading(false);
    })();
  }, [username]);

  // Open message modal if coming from product page with ?contact=1
  const searchParams = useSearchParams();
  useEffect(()=>{
    if (searchParams?.get('contact') === '1') {
      if (currentUser) setMessageOpen(true);
      else if (creator) router.push(`/auth/login?redirect=/creator/${creator.username}?contact=1`);
    }
  }, [searchParams, currentUser, creator, router]);

  // Detect current user for auth-based UI gating
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user || null);
    })();
  }, []);

  const isOwner = !!(currentUser && creator && currentUser.id === creator.id);

  // Load recent activity after creator & products fetched
  useEffect(() => {
    async function loadActivity() {
      if (!creator) return;
      setActivityLoading(true);
      try {
  const activities: Array<{ id: string; type: 'product' | 'review' | 'post'; created_at: string; title: string; extra?: string; tags?: string[]; link?: string; videoId?: string }> = [];
        // Recent products already present
        creator.products.slice(0,5).forEach(p => activities.push({ id: `p-${p.id}`, type: 'product', created_at: p.created_at, title: p.title }));
        const productIds = creator.products.map(p=>p.id);
        if (productIds.length) {
          const { data: revs } = await supabase
            .from('reviews')
            .select('id, created_at, comment, product:products(id,title)')
            .in('product_id', productIds)
            .order('created_at', { ascending: false })
            .limit(5);
          (revs||[]).forEach(r => {
            const prodTitle = Array.isArray(r.product) ? r.product[0]?.title : (r.product as any)?.title;
            activities.push({ id: `r-${r.id}`, type: 'review', created_at: r.created_at, title: prodTitle || 'Product', extra: r.comment?.slice(0,80) });
          });
        }
        activities.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(activities.slice(0,9));
      } catch (e) {
        console.warn('Recent activity load failed', e);
      } finally {
        setActivityLoading(false);
      }
    }
    loadActivity();
  }, [creator]);

  // Real follower / following counts
  useEffect(() => {
    async function loadFollowerCounts() {
      if (!creator) return;
      try {
        const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
          supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id),
          supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('subscriber_id', creator.id)
        ]);
        setCreator(prev => prev ? { ...prev, followers: followerCount || 0, following: followingCount || 0 } : prev);
      } catch (e) {
        console.warn('Follower counts load failed', e);
      }
    }
    loadFollowerCounts();
  }, [creator?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading…</div>;
  if (!creator) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <UserCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Creator not found</h1>
        <a href="/" className="text-blue-600 hover:underline inline-flex items-center gap-1">Return home <ArrowTopRightOnSquareIcon className="h-4 w-4"/></a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Cover Section */}
      <div className="relative h-72 w-full bg-gray-200 group overflow-hidden">
        {creator.background_image ? (
          <img src={creator.background_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        {isOwner && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center text-white text-xs gap-2">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <CameraIcon className="h-6 w-6" />
              </div>
              <span className="font-medium">{updating === 'cover' ? 'Uploading…' : 'Change Cover Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>onSelectFile(e,'cover')} disabled={updating==='cover'} />
            </label>
          </div>
        )}
        {!isOwner && (
          <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={()=>setSubscribeOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm shadow hover:bg-blue-700 flex items-center gap-1"><AddCircleOutlineIcon className="h-4 w-4"/>Subscribe</button>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={()=>setShareOpen(true)} className="px-4 py-2 bg-white/90 rounded-full text-sm shadow hover:bg-white flex items-center gap-1"><ShareIcon fontSize="small"/>Share</button>
        </div>
    <ShareModal isOpen={shareOpen} onClose={()=>setShareOpen(false)} username={creator.username} />
      </div>

      {/* Floating Profile Card */}
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
  <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-8">
          <div className="relative w-40 shrink-0">
            <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex items-center justify-center bg-gray-100 group/avatar">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="h-28 w-28 text-gray-300" />
              )}
              {isOwner && (
                <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white text-xs gap-1">
                  <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <PhotoCameraFrontIcon fontSize="small" />
                  </div>
                  <span className="font-medium">{updating==='avatar'?'Uploading…':'Change'}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={updating==='avatar'} onChange={(e)=>onSelectFile(e,'avatar')} />
                </label>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">{creator.full_name}</h1>
            <p className="text-gray-600 mb-4 max-w-2xl">{creator.bio}</p>
            <SocialIconsBar links={creator.social_links} className="mb-6" />
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              {creator.location && <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4"/> {creator.location}</span>}
              <span>Joined {new Date(creator.created_at).toLocaleDateString(undefined,{ month:'long', year:'numeric'})}</span>
              {creator.website && <a href={creator.website} target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1"><LinkIcon className="h-4 w-4"/>Website</a>}
            </div>
            <div className="flex gap-10 mb-6">
              <div>
                <div className="text-xl font-semibold">{creator.followers?.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Followers</div>
              </div>
              <div>
                <div className="text-xl font-semibold">{creator.following?.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Following</div>
              </div>
              <div>
                <div className="text-xl font-semibold">{creator.totalProducts}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Products</div>
              </div>
            </div>
            <div className="flex gap-3">
              {!isOwner && (
                <button onClick={()=>{ if (!currentUser) { router.push(`/auth/login?redirect=/creator/${creator.username}?contact=1`); } else { setMessageOpen(true); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1"><ChatBubbleLeftRightIcon className="h-4 w-4"/>Message</button>
              )}
              <button onClick={()=>setShareOpen(true)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 inline-flex items-center gap-1"><ShareIcon className="h-4 w-4"/>Share</button>
              {isOwner && (
              <button onClick={()=>{ if (!creator) return; setSettings({
                bio: creator.bio || '', website: creator.website || '', location: creator.location || '',
                twitter: creator.social_links?.twitter || creator.social_links?.Twitter || '',
                instagram: creator.social_links?.instagram || '',
                youtube: creator.social_links?.youtube || creator.social_links?.YouTube || '',
                facebook: creator.social_links?.facebook || '',
                linkedin: creator.social_links?.linkedin || ''
              }); setSettingsOpen(true); }} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Settings</button>
              )}
              <div className="relative">
                <button onClick={()=>setMoreOpen(o=>!o)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 inline-flex items-center gap-1"><MoreHorizIcon fontSize="small"/>More</button>
                {moreOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg text-sm z-20">
                    <button onClick={()=>{navigator.clipboard.writeText(window.location.href); setMoreOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-gray-50">Copy Link</button>
                    <button onClick={()=>{setShareOpen(true); setMoreOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-gray-50">Share</button>
                    <button onClick={()=>{alert('Report submitted (stub)'); setMoreOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Report</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer social icons duplication (optional) */}
      <div className="max-w-6xl mx-auto px-6 mt-8 pb-10">
        <SocialIconsBar links={creator.social_links} className="justify-center" />
      </div>
  {moreOpen && <div onClick={()=>setMoreOpen(false)} className="fixed inset-0 z-10" aria-hidden="true" />}

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto px-6 mt-10 space-y-10 pb-24">
        {/* Featured Products */}
  <section className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">Featured Products <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{creator.totalProducts}</span></h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 inline-flex items-center gap-1">View All</button>
                {isOwner && (
                  <button onClick={()=>setAddProductOpen(true)} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"><AddCircleOutlineIcon fontSize="small"/>Add Product</button>
                )}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {creator.products.slice(0,3).map(p => {
              const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
              const videos = Array.isArray(p.videos) ? p.videos.filter(Boolean) : [];
              const features = Array.isArray(p.features) ? p.features.filter(Boolean) : [];
              const hasVideo = videos.length > 0;
              const imageCount = images.length;
              const featureCount = features.length;
              const price = (typeof p.base_price === 'number' && p.base_price >= 0) ? p.base_price : undefined;
              return (
  <Link href={`/product/${p.id}`} key={p.id} prefetch className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition relative block">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                    {imageCount > 0 ? (
          <img src={images[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
          <span className="text-gray-400">No media yet</span>
                    )}
                    <button type="button" onClick={(e)=>{e.preventDefault(); setShareProduct({ url: `${window.location.origin}/product/${p.id}`, title: p.title });}}
                      className="absolute right-2 top-2 bg-white/90 hover:bg-white text-gray-700 rounded-full px-2.5 py-1 text-xs shadow">
                      Share
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-1 flex-wrap">
                        {hasVideo && (
                          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><PlayCircleIcon className="h-3 w-3"/>Video</span>
                        )}
                        {imageCount > 1 && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><StarIcon fontSize="inherit" style={{fontSize:'12px'}}/>{imageCount} Images</span>
                        )}
                        {featureCount > 0 && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><StarIcon fontSize="inherit" style={{fontSize:'12px'}}/>{featureCount} Feature{featureCount>1?'s':''}</span>
                        )}
                        {!hasVideo && imageCount <= 1 && featureCount === 0 && (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1">Basic</span>
                        )}
                      </div>
                      <span className="font-semibold text-blue-600">{price !== undefined ? `$${price}` : 'Free'}</span>
                    </div>
                  </div>
  </Link>
              );
            })}
            {creator.products.length === 0 && <p className="text-sm text-gray-500">No products yet.</p>}
          </div>
          {shareProduct && (
            <ShareModal isOpen={!!shareProduct} onClose={()=>setShareProduct(null)} url={shareProduct.url} title={shareProduct.title} />
          )}
        </section>

        {/* Reviews Slider Placeholder */}
  <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Client Reviews</h2>
          <ReviewsSlider creatorId={creator.id} />
        </section>

        {/* Video Section */}
  <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Latest Video</h2>
          {(() => {
            // Attempt to derive a YouTube video id from social_links (e.g., full URL) or use fallback demo
            const yt = creator.social_links?.youtube || creator.social_links?.YouTube || '';
            let videoId = '';
            if (yt) {
              const match = yt.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
              if (match) videoId = match[1];
              else if (/^[A-Za-z0-9_-]{6,}$/.test(yt)) videoId = yt; // already id
            }
            if (!videoId) videoId = 'dQw4w9WgXcQ'; // fallback placeholder
            return <YouTubeEmbed videoId={videoId} title="Featured Video" className="p-0" />;
          })()}
        </section>

        {/* Recent Activity Feed */}
        <section className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">Recent Activity <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Live</span></h2>
            {isOwner && (
              <button onClick={()=>setAddPostOpen(true)} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"><AddCircleOutlineIcon fontSize="small"/>Add Post</button>
            )}
          </div>
          {activityLoading ? (
            <div className="text-sm text-gray-500">Loading activity…</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-sm text-gray-500">No recent activity.</div>
          ) : (
            <ul className="grid md:grid-cols-3 gap-4">
              {recentActivity.map(a => (
                <li key={a.id} className="p-4 rounded-xl border bg-gray-50 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${a.type==='product' ? 'bg-blue-100 text-blue-700' : a.type==='review' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{a.type==='product'?'Product': a.type==='review' ? 'Review' : 'Post'}</span>
                    <span className="text-gray-500">{new Date(a.created_at).toLocaleDateString(undefined,{month:'short', day:'numeric'})}</span>
                  </div>
                  <div className="text-sm font-semibold line-clamp-2">{a.title}</div>
                  {a.extra && <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line">{a.extra}</p>}
                  {/* Render YT embed for posts with video */}
                  {a.type==='post' && a.videoId && (
                    <div className="aspect-video rounded-md overflow-hidden bg-black/5">
                      <iframe
                        src={`https://www.youtube.com/embed/${a.videoId}`}
                        className="w-full h-full"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {a.tags && a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.tags.slice(0,4).map(t=> <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-200 rounded-full text-gray-700">{t}</span>)}
                    </div>
                  )}
                  {a.link && <a href={a.link} target="_blank" className="text-[11px] text-blue-600 hover:underline break-all">{a.link}</a>}
                  {a.videoId && a.type!=='post' && <span className="text-[10px] text-red-600 font-medium">Video • {a.videoId}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {/* Add Product Modal */}
  {isOwner && addProductOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2"><AddCircleOutlineIcon fontSize="small"/> Create New Product</h3>
              <button onClick={()=>setAddProductOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {productTypes.map(pt => (
                <button key={pt.key} onClick={()=>setSelectedType(pt.key)} className={`text-left border rounded-lg p-4 hover:border-blue-400 transition ${selectedType===pt.key?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
                  <div className="font-medium text-sm mb-1">{pt.label}</div>
                  <div className="text-[11px] text-gray-500 leading-snug">{pt.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Upload Images</label>
              <div className="relative border-2 border-dashed rounded-xl p-6 bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-3xl">↑</div>
                  <p className="text-sm">Click to add images (multiple supported)</p>
                  <p className="text-[11px] text-gray-400">PNG, JPG up to ~5MB each</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e=>{
                    const files = Array.from(e.target.files || []);
                    if (files.length) setMediaFiles(prev => [...prev, ...files]);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              {mediaFiles.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Selected ({mediaFiles.length})</div>
                  <ul className="space-y-2 max-h-40 overflow-auto">
                    {mediaFiles.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1 bg-white">
                        <span className="text-xs truncate flex-1">{f.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx===0}
                            onClick={()=>setMediaFiles(prev=>{ const arr=[...prev]; const t=arr[idx-1]; arr[idx-1]=arr[idx]; arr[idx]=t; return arr; })}
                            className="text-[11px] px-2 py-0.5 border rounded disabled:opacity-50"
                          >Up</button>
                          <button
                            type="button"
                            disabled={idx===mediaFiles.length-1}
                            onClick={()=>setMediaFiles(prev=>{ const arr=[...prev]; const t=arr[idx+1]; arr[idx+1]=arr[idx]; arr[idx]=t; return arr; })}
                            className="text-[11px] px-2 py-0.5 border rounded disabled:opacity-50"
                          >Down</button>
                          <button
                            type="button"
                            onClick={()=>setMediaFiles(prev=>prev.filter((_,i)=>i!==idx))}
                            className="text-[11px] px-2 py-0.5 border rounded text-red-600"
                          >Remove</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={()=>setMediaFiles([])} className="text-xs text-red-600 hover:underline">Clear all</button>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input value={newProduct.title} onChange={e=>setNewProduct(p=>({...p,title:e.target.value}))} placeholder="Enter product name" className="w-full border rounded-lg px-3 py-2 text-sm" maxLength={80} />
                <div className="text-[11px] text-gray-400 text-right mt-1">{newProduct.title.length}/80</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Description *</label>
                <textarea value={newProduct.description} onChange={e=>setNewProduct(p=>({...p,description:e.target.value}))} placeholder="Describe your product" className="w-full border rounded-lg px-3 py-2 text-sm h-28" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Base Price</label>
                  <input value={newProduct.price} onChange={e=>setNewProduct(p=>({...p,price:e.target.value}))} placeholder="19.00" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <div className="border rounded-lg px-3 py-2 text-sm bg-gray-50">{productTypes.find(p=>p.key===selectedType)?.label}</div>
                </div>
              </div>
              {/* Common extra fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promo YouTube Video</label>
                  <input value={productExtras.videoUrl} onChange={e=>setProductExtras(x=>({...x,videoUrl:e.target.value}))} placeholder="https://youtu.be/.. or ID" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">External / Demo Link</label>
                  <input value={productExtras.externalUrl} onChange={e=>setProductExtras(x=>({...x,externalUrl:e.target.value}))} placeholder="https://example.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
                <input value={productExtras.tags} onChange={e=>setProductExtras(x=>({...x,tags:e.target.value}))} placeholder="branding, logo, design" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              {/* Digital product specific */}
              {selectedType==='digital' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">File Format</label>
                    <input value={productExtras.fileFormat} onChange={e=>setProductExtras(x=>({...x,fileFormat:e.target.value}))} placeholder="PDF" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Download URL</label>
                    <input value={productExtras.downloadUrl} onChange={e=>setProductExtras(x=>({...x,downloadUrl:e.target.value}))} placeholder="(optional)" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">File Size</label>
                    <input value={productExtras.fileSize} onChange={e=>setProductExtras(x=>({...x,fileSize:e.target.value}))} placeholder="15MB" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">License Type</label>
                    <input value={productExtras.licenseType} onChange={e=>setProductExtras(x=>({...x,licenseType:e.target.value}))} placeholder="Personal / Commercial" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              {/* Consultation specific */}
              {selectedType==='consultation' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                    <input value={productExtras.consultationDuration} onChange={e=>setProductExtras(x=>({...x,consultationDuration:e.target.value}))} placeholder="30" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                    <input value={productExtras.consultationMethod} onChange={e=>setProductExtras(x=>({...x,consultationMethod:e.target.value}))} placeholder="Zoom" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Availability</label>
                    <input value={productExtras.consultationAvailability} onChange={e=>setProductExtras(x=>({...x,consultationAvailability:e.target.value}))} placeholder="Weekdays" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              {/* Course specific */}
              {selectedType==='course' && (
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Modules</label>
                      <input value={productExtras.courseModules} onChange={e=>setProductExtras(x=>({...x,courseModules:e.target.value}))} placeholder="10" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total Hours</label>
                      <input value={productExtras.courseHours} onChange={e=>setProductExtras(x=>({...x,courseHours:e.target.value}))} placeholder="5" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                      <input value={productExtras.courseLevel} onChange={e=>setProductExtras(x=>({...x,courseLevel:e.target.value}))} placeholder="Beginner" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Curriculum Outline</label>
                    <textarea value={productExtras.courseCurriculum} onChange={e=>setProductExtras(x=>({...x,courseCurriculum:e.target.value}))} placeholder="Module 1: ...\nModule 2: ..." className="w-full border rounded-lg px-3 py-2 text-sm h-28" />
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoMessageEnabled}
                    onChange={(e)=>setAutoMessageEnabled(e.target.checked)}
                    className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                  />
                  <span>
                    Send an automated welcome message after purchase
                    <span className="block text-xs text-gray-500">Buyers receive this once their order is confirmed.</span>
                  </span>
                </label>
                {autoMessageEnabled && (
                  <textarea
                    value={autoMessage}
                    onChange={(e)=>setAutoMessage(e.target.value)}
                    rows={4}
                    className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Thanks for purchasing! Please share your project details here..."
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>{setAddProductOpen(false); setAutoMessageEnabled(false); setAutoMessage('');}} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button disabled={savingProduct || !newProduct.title} onClick={async ()=>{
                if (!creator || !newProduct.title) return;
                setSavingProduct(true);
                try {
                  let insertedId = `local-${Date.now()}`;
                  const priceNum = parseFloat(newProduct.price||'0');
                  // Build dynamic arrays
                  const tagArray = productExtras.tags.split(',').map(t=>t.trim()).filter(Boolean);
                  const youTubeMatch = productExtras.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) || productExtras.videoUrl.match(/^([A-Za-z0-9_-]{6,})$/);
                  const videoId = youTubeMatch ? youTubeMatch[1] : '';
                  const featureLines: string[] = [];
                  if (selectedType==='digital') {
                    if (productExtras.fileFormat) featureLines.push(`Format: ${productExtras.fileFormat}`);
                    if (productExtras.fileSize) featureLines.push(`Size: ${productExtras.fileSize}`);
                    if (productExtras.licenseType) featureLines.push(`License: ${productExtras.licenseType}`);
                  } else if (selectedType==='consultation') {
                    if (productExtras.consultationDuration) featureLines.push(`Duration: ${productExtras.consultationDuration}min`);
                    if (productExtras.consultationMethod) featureLines.push(`Method: ${productExtras.consultationMethod}`);
                    if (productExtras.consultationAvailability) featureLines.push(`Availability: ${productExtras.consultationAvailability}`);
                  } else if (selectedType==='course') {
                    if (productExtras.courseModules) featureLines.push(`Modules: ${productExtras.courseModules}`);
                    if (productExtras.courseHours) featureLines.push(`Hours: ${productExtras.courseHours}`);
                    if (productExtras.courseLevel) featureLines.push(`Level: ${productExtras.courseLevel}`);
                  }
                  const requirements: string[] = [];
                  if (productExtras.externalUrl) requirements.push(`External: ${productExtras.externalUrl}`);
                  if (selectedType==='digital' && productExtras.downloadUrl) requirements.push(`Download: ${productExtras.downloadUrl}`);
                  if (selectedType==='course' && productExtras.courseCurriculum) requirements.push(`Curriculum: ${productExtras.courseCurriculum.slice(0,400)}`);
                  const typeMapping: Record<string,'product'|'service'> = { digital:'product', consultation:'service', course:'service' };
                  const slugBase = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
                  const slug = `${slugBase}-${Date.now().toString(36)}`;
                  // Upload selected media files (if any) and collect public URLs
                  let imageUrls: string[] = [];
                  if (mediaFiles.length) {
                    setUploadingCount(mediaFiles.length);
                    const tasks = mediaFiles.map(async (file, idx) => {
                      try {
                        // Resize to max 1600x1600 and convert to WebP
                        const resized = await resizeImage(file, 1600, 1600, 'image/webp', 0.85);
                        const stamp = Date.now() + idx;
                        const rand = Math.random().toString(36).slice(2,8);
                        const path = `${creator.id}/${slug}/img-${stamp}-${rand}.webp`;
                        const bucket = 'product-images';
                        const { error: upErr } = await supabase.storage.from(bucket).upload(path, resized, { upsert: true, cacheControl: '3600', contentType: 'image/webp' });
                        if (!upErr) {
                          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
                          return `${pub.publicUrl}?v=${stamp}`;
                        }
                      } catch (e) {
                        console.warn('Image upload failed', e);
                      }
                      return undefined;
                    });
                    const results = await Promise.all(tasks);
                    imageUrls = results.filter(Boolean) as string[];
                    setUploadingCount(0);
                  }
                  const insertPayload: any = {
                    title: newProduct.title,
                    description: newProduct.description,
                    base_price: isNaN(priceNum)? 0 : priceNum,
                    creator_id: creator.id,
                    type: typeMapping[selectedType] || 'product',
                    slug,
                    features: featureLines,
                    requirements,
                    tags: tagArray,
                    videos: videoId ? [videoId] : [],
                    images: imageUrls,
                    auto_message_enabled: autoMessageEnabled,
                    auto_message: autoMessageEnabled ? autoMessage : null,
                    status: 'active'
                  };
                  const { data, error } = await supabase.from('products').insert(insertPayload).select('id,created_at,features,requirements,tags,videos');
                  if (!error && data) insertedId = (Array.isArray(data) ? data[0]?.id : (data as any)?.id) || insertedId;
                  const created_at = (Array.isArray(data)? data[0]?.created_at : (data as any)?.created_at) || new Date().toISOString();
                  // Create a default package so the product has a buy option immediately
                  try {
                    const defaultPkg = {
                      product_id: insertedId,
                      name: 'Standard',
                      description: newProduct.description?.slice(0,160) || 'Standard package',
                      price: isNaN(priceNum)? 0 : priceNum,
                      delivery_time: 3,
                      revisions: 1,
                      features: (Array.isArray((Array.isArray(data)? data[0]?.features : (data as any)?.features))
                        ? (Array.isArray(data)? data[0]?.features : (data as any)?.features)
                        : featureLines),
                      sort_order: 1
                    } as any;
                    await supabase.from('product_packages').insert(defaultPkg);
                  } catch (e) {
                    console.warn('Default package create failed', e);
                  }
                  const productObj = {
                    id: insertedId,
                    title: newProduct.title,
                    description: newProduct.description,
                    created_at,
                    images: imageUrls,
                    videos: (Array.isArray(data)? data[0]?.videos : (data as any)?.videos) || (videoId?[videoId]:[]),
                    features: (Array.isArray(data)? data[0]?.features : (data as any)?.features) || featureLines,
                    base_price: isNaN(priceNum)? undefined: priceNum,
                    auto_message_enabled: autoMessageEnabled,
                    auto_message: autoMessageEnabled ? autoMessage : null
                  };
                  setCreator(prev => prev ? { ...prev, products: [productObj, ...prev.products], totalProducts: prev.totalProducts + 1 } : prev);
                  setNewProduct({ title:'', description:'', price:'' });
                  setProductExtras({ videoUrl:'', externalUrl:'', tags:'', fileFormat:'', downloadUrl:'', fileSize:'', licenseType:'', consultationDuration:'', consultationMethod:'', consultationAvailability:'', courseModules:'', courseHours:'', courseCurriculum:'', courseLevel:'' });
                  setAutoMessageEnabled(false);
                  setAutoMessage('');
                  setMediaFiles([]);
                  setAddProductOpen(false);
                } catch(e){ console.warn('Add product failed', e); }
                finally { setSavingProduct(false);} 
              }} className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{savingProduct? (uploadingCount>0?`Uploading ${uploadingCount}…`:'Saving…') :'Create Product'}</button>
            </div>
            <p className="text-[11px] text-gray-400">Extended fields (media gallery, pricing tiers, content gating) can be added later.</p>
          </div>
        </div>
      )}
      {/* Subscribe Modal */}
      {subscribeOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5">
            <div className="flex justify-end">
              <button onClick={()=>setSubscribeOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="flex flex-col items-center text-center -mt-8">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow mb-3 bg-gray-100 flex items-center justify-center">
                {creator.avatar_url ? <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover"/> : <UserCircleIcon className="h-12 w-12 text-gray-300"/>}
              </div>
              <h3 className="font-semibold mb-2">Subscribe to {creator.username}</h3>
              <form onSubmit={async e=>{e.preventDefault(); if(!subscribeEmail) return; setSubscribing(true); try { await supabase.from('newsletter_subscriptions').insert({ creator_id: creator.id, email: subscribeEmail, source: 'creator_profile' }); setSubscribeEmail(''); setSubscribeOpen(false); } catch(err){ console.warn('Subscribe failed', err);} finally { setSubscribing(false);} }} className="w-full flex rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500">
                <input type="email" required placeholder="Sign Up" value={subscribeEmail} onChange={e=>setSubscribeEmail(e.target.value)} className="flex-1 px-3 py-2 text-sm outline-none" />
                <button disabled={subscribing} className="px-4 bg-gray-800 text-white text-sm font-medium hover:bg-black disabled:opacity-50">{subscribing? '...' : 'Submit'}</button>
              </form>
              <p className="text-[11px] text-gray-500 mt-2">We respect your inbox. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      )}
      {/* Message Modal */}
  {messageOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Message {creator.full_name}</h3>
              <button onClick={()=>setMessageOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <textarea value={messageBody} onChange={e=>setMessageBody(e.target.value)} placeholder="Write your message..." className="w-full border rounded px-3 py-2 text-sm h-40" />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setMessageOpen(false)} className="px-3 py-2 text-sm rounded border">Cancel</button>
              <button onClick={()=>{ console.log('Send message (stub):', messageBody); setMessageBody(''); setMessageOpen(false); }} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Send</button>
            </div>
            <p className="text-[11px] text-gray-400">Stub only – hook into real messaging service later.</p>
          </div>
        </div>
      )}
      {/* Settings Modal */}
  {isOwner && settingsOpen && creator && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile Settings</h3>
              <button onClick={()=>setSettingsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <textarea value={settings.bio} onChange={e=>setSettings(s=>({...s,bio:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm h-24" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                  <input value={settings.website} onChange={e=>setSettings(s=>({...s,website:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input value={settings.location} onChange={e=>setSettings(s=>({...s,location:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input placeholder="Twitter" value={settings.twitter} onChange={e=>setSettings(s=>({...s,twitter:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Instagram" value={settings.instagram} onChange={e=>setSettings(s=>({...s,instagram:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="YouTube" value={settings.youtube} onChange={e=>setSettings(s=>({...s,youtube:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Facebook" value={settings.facebook} onChange={e=>setSettings(s=>({...s,facebook:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="LinkedIn" value={settings.linkedin} onChange={e=>setSettings(s=>({...s,linkedin:e.target.value}))} className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setSettingsOpen(false)} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button onClick={async ()=>{
                const social = {
                  twitter: settings.twitter, instagram: settings.instagram, youtube: settings.youtube,
                  facebook: settings.facebook, linkedin: settings.linkedin
                } as any;
                const updates:any = { bio: settings.bio, website: settings.website, location: settings.location, social_links: social };
                const { error } = await supabase.from('users').update(updates).eq('id', creator.id);
                if (!error) {
                  setCreator(prev=> prev? { ...prev, ...updates }: prev);
                  setSettingsOpen(false);
                  pushToast({ type:'success', title:'Saved', message:'Profile settings updated' });
                }
              }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Add Post Modal */}
  {isOwner && addPostOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Add Post / Update</h3>
              <button onClick={()=>setAddPostOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <input value={newPostTitle} onChange={e=>setNewPostTitle(e.target.value)} placeholder="Title *" className="w-full border rounded px-3 py-2 text-sm" />
            <textarea value={newPostBody} onChange={e=>setNewPostBody(e.target.value)} placeholder="Body / Content" className="w-full border rounded px-3 py-2 text-sm h-40" />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link (optional)</label>
                <input value={newPostLink} onChange={e=>setNewPostLink(e.target.value)} placeholder="https://..." className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">YouTube Video</label>
                <input value={newPostVideo} onChange={e=>setNewPostVideo(e.target.value)} placeholder="URL or ID" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma)</label>
              <input value={newPostTags} onChange={e=>setNewPostTags(e.target.value)} placeholder="update, launch" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={()=>setAddPostOpen(false)} className="px-3 py-2 text-sm rounded border">Cancel</button>
              <button onClick={()=>{ if(!newPostTitle) return; const tags=newPostTags.split(',').map(t=>t.trim()).filter(Boolean); const match = newPostVideo.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) || newPostVideo.match(/^([A-Za-z0-9_-]{6,})$/); const vid= match? match[1]: undefined; const act={ id:`post-${Date.now()}`, type:'post' as const, created_at:new Date().toISOString(), title:newPostTitle, extra:newPostBody.slice(0,160), tags, link:newPostLink||undefined, videoId:vid}; setRecentActivity(prev=>[act,...prev].slice(0,9)); setNewPostTitle(''); setNewPostBody(''); setNewPostLink(''); setNewPostVideo(''); setNewPostTags(''); setAddPostOpen(false); }} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Publish</button>
            </div>
            <p className="text-[11px] text-gray-400">Posts are in-memory only right now – persist to a posts table later.</p>
          </div>
        </div>
      )}
    </div>
  );
}
