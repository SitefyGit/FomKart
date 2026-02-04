// CLEAN REWRITE (corruption removed)
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase, fetchCreatorPosts, createCreatorPost, deleteCreatorPost, deleteProduct, addToCart, type CreatorPost, type ProductDigitalAsset, type CourseDeliveryPayload } from "@/lib/supabase";
// Icons (Heroicons + MUI)
import { UserCircleIcon, MapPinIcon, LinkIcon, ArrowTopRightOnSquareIcon, PlayCircleIcon, ChatBubbleLeftRightIcon, CameraIcon, Bars3Icon } from '@heroicons/react/24/outline';
import ShareIcon from '@mui/icons-material/Share';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import StarIcon from '@mui/icons-material/StarOutline';
import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import { ReviewsSlider } from '@/components/ReviewsSlider';
import { SocialIconsBar } from '@/components/SocialIconsBar';
import { ToastContainer, ToastItem } from '@/components/Toast';
import { ShareModal } from '@/components/ShareModal';

interface AdminSettings {
  auto_approve_products: boolean
  max_images_per_product: number
  require_verification: boolean
}

type CategoryOption = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: CategoryOption[]
}

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
  status?: string;
  type?: 'product' | 'service' | 'course' | 'consultation';
}

type NewProductInsert = {
  title: string;
  description: string;
  base_price: number;
  creator_id: string;
  type: 'product' | 'service' | 'course' | 'consultation';
  slug: string;
  features: string[];
  requirements: string[];
  tags: string[];
  videos: string[];
  images: string[];
  auto_message_enabled: boolean;
  auto_message: string | null;
  status: 'active' | 'draft' | 'paused' | 'archived' | 'sold_out' | 'pending';
  digital_files?: ProductDigitalAsset[] | null;
  course_delivery?: CourseDeliveryPayload | null;
  auto_deliver?: boolean;
  is_digital?: boolean;
  category_id?: string | null;
  subcategory_id?: string | null;
};

type ProductInsertRow = {
  id: string;
  created_at: string;
  features?: string[] | null;
  requirements?: string[] | null;
  tags?: string[] | null;
  videos?: string[] | null;
  images?: string[] | null;
};

type ProductPackageInsert = {
  product_id: string;
  name: string;
  description: string;
  price: number;
  delivery_time: number;
  revisions: number;
  features: string[];
  sort_order: number;
};

function isProductInsertRow(value: unknown): value is ProductInsertRow {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  if (typeof record.id !== "string" || typeof record.created_at !== "string") {
    return false;
  }

  const arrayFields: Array<keyof ProductInsertRow> = [
    "features",
    "requirements",
    "tags",
    "videos",
    "images"
  ];

  return arrayFields.every((field) => {
    const fieldValue = record[field];
    return (
      fieldValue === undefined ||
      fieldValue === null ||
      (Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "string"))
    );
  });
}
interface Creator {
  id: string; username: string; full_name: string; bio?: string; avatar_url?: string; created_at: string;
  background_image?: string; products: Product[]; totalProducts: number;
  location?: string; website?: string; social_links?: Record<string, string>;
  profile_section_order?: ProfileSectionKey[] | null;
  is_verified?: boolean;
}

type CreatorProfileUpdate = Pick<Creator, "bio" | "website" | "location" | "social_links">;

async function loadCreator(username: string): Promise<Creator | null> {
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
      .select('id,title,description,created_at,images,videos,features,base_price,type,status')
      .eq('creator_id', userData.id)
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
      type: p.type,
      status: p.status
    }));

    if (productList.length === 0) {
      for (let i = 1; i <= 3; i++) {
        productList.push({
          id: `dummy-${i}`,
          title: `Sample Product ${i}`,
          description: `This is a placeholder description for sample product ${i}. Replace by adding a real product.`,
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
          images: [],
          videos: [],
          features: ['Feature A', 'Feature B'].slice(0, i),
          base_price: i * 10 + 9,
          type: 'product',
          status: 'active'
        });
      }
    }

    const layout = Array.isArray(userData.profile_section_order)
      ? (userData.profile_section_order.filter((section: string): section is ProfileSectionKey => (DEFAULT_SECTION_ORDER as string[]).includes(section)))
      : null;

    return {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name || userData.username,
      bio: userData.bio || 'Creative professional.',
      avatar_url: userData.avatar_url,
      created_at: userData.created_at,
      background_image: userData.background_image,
      location: userData.location,
      website: userData.website,
      social_links: userData.social_links || {},
      products: productList,
      totalProducts: productList.length,
      profile_section_order: layout,
      is_verified: userData.is_verified
    };
  } catch {
    return null;
  }
}

// Image helpers: resize client-side for faster uploads
async function resizeImage(file: File, maxWidth: number, maxHeight: number, mime = 'image/webp', quality = 0.85): Promise<Blob> {
  try {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
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

type VideoMeta = { provider: 'youtube' | 'vimeo'; id: string };

type ProfileSectionKey = 'products' | 'reviews' | 'links'

const DEFAULT_SECTION_ORDER: ProfileSectionKey[] = ['products', 'reviews', 'links']

const POST_IMAGE_BUCKET = 'creator-posts';
const POST_IMAGE_MAX_EDGE = 1600;

function extractVideoMeta(rawUrl: string): VideoMeta | null {
  const url = rawUrl.trim();
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (youtubeMatch) {
    return { provider: 'youtube', id: youtubeMatch[1] };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return { provider: 'vimeo', id: vimeoMatch[1] };
  }
  return null;
}

function getEmbedUrl(meta: VideoMeta): string {
  if (meta.provider === 'youtube') {
    return `https://www.youtube.com/embed/${meta.id}`;
  }
  return `https://player.vimeo.com/video/${meta.id}`;
}

function ImagePreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
  if (!src) return <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={file.name} className="w-10 h-10 object-cover rounded border border-gray-200" />;
}

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // 'avatar' | 'cover'
  const [currentUser, setCurrentUser] = useState<SupabaseAuthUser | null>(null);
  const [shareOpen, setShareOpen] = useState(false); // State for Share Modal
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '' });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
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
    consultationLiveEnabled: false,
    consultationCallType: '',
    consultationProvider: '',
    serviceDuration: '',
    serviceAvailability: '',
    courseModules: '',
    courseHours: '',
    courseCurriculum: '',
    courseLevel: '',
    courseAccessLinks: '',
    coursePasskeys: '',
    courseAccessNotes: ''
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    auto_approve_products: true,
    max_images_per_product: 5,
    require_verification: false
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('key, value')
      if (data) {
        const settings: any = {}
        data.forEach(s => settings[s.key] = s.value)
        setAdminSettings({
          auto_approve_products: settings.auto_approve_products !== 'false',
          max_images_per_product: parseInt(settings.max_images_per_product || '5'),
          require_verification: settings.require_verification === 'true'
        })
      }
    }
    fetchSettings()
  }, [])

  // Fetch categories for product creation
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      
      if (data) {
        // Build tree structure
        const categoryMap = new Map<string, CategoryOption>()
        const rootCategories: CategoryOption[] = []
        
        data.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] })
        })
        
        data.forEach(cat => {
          const category = categoryMap.get(cat.id)!
          if (cat.parent_id && categoryMap.has(cat.parent_id)) {
            categoryMap.get(cat.parent_id)!.children!.push(category)
          } else {
            rootCategories.push(category)
          }
        })
        
        setCategories(rootCategories)
      }
    }
    fetchCategories()
  }, [])

  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    type: 'post' | 'product';
    id: string;
    title?: string;
  }>({ show: false, type: 'product', id: '' });
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [addPostOpen, setAddPostOpen] = useState(false);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postType, setPostType] = useState<CreatorPost['post_type']>('text');
  const [postCaption, setPostCaption] = useState('');
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sectionOrder, setSectionOrder] = useState<ProfileSectionKey[]>(DEFAULT_SECTION_ORDER);
  const [draggingSection, setDraggingSection] = useState<ProfileSectionKey | null>(null);
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
    { key: 'service', label: 'Service', desc: 'One-off services, hourly work, or live sessions (non-digital)' },
    { key: 'course', label: 'Course', desc: 'Training program with embedded lessons' }
  ];
  const [selectedType, setSelectedType] = useState('digital');
  // New: support multiple product images in a gallery
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);

  const resetPostForm = useCallback(() => {
    setPostType('text');
    setPostCaption('');
    setPostLinkUrl('');
    setPostVideoUrl('');
    setPostTags('');
    setPostImageFile(null);
    setPostImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const closePostModal = useCallback(() => {
    setAddPostOpen(false);
    resetPostForm();
  }, [resetPostForm]);

  const buildActivityEntryFromPost = useCallback((post: CreatorPost) => {
    const caption = (post.caption || '').trim();
    const captionLines = caption ? caption.split(/\r?\n/).filter(Boolean) : [];
    const fallbackTitle = post.post_type === 'video'
      ? 'Shared a new video'
      : post.post_type === 'image'
        ? 'Shared a new photo'
        : 'Shared an update';
    const title = captionLines[0]?.slice(0, 80) || fallbackTitle;
    const isKnownProvider = post.video_provider === 'youtube' || post.video_provider === 'vimeo';
    const embedUrl = post.post_type === 'video' && isKnownProvider && post.video_id
      ? getEmbedUrl({ provider: post.video_provider as 'youtube' | 'vimeo', id: post.video_id })
      : undefined;

    return {
      id: `post-${post.id}`,
      type: 'post' as const,
      created_at: post.created_at,
      title,
      extra: caption || undefined,
      tags: post.tags && post.tags.length ? post.tags.filter(Boolean) : undefined,
      link: post.link_url || undefined,
      videoId: post.post_type === 'video' && post.video_provider === 'youtube' ? post.video_id || undefined : undefined,
      imageUrl: post.post_type === 'image' ? post.media_url || undefined : undefined,
      embedUrl,
      postType: post.post_type
    };
  }, []);

  useEffect(() => {
    return () => {
      if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    };
  }, [postImagePreview]);

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
      const updates: Partial<Pick<Creator, 'avatar_url' | 'background_image'>> =
        type === 'avatar' ? { avatar_url: url } : { background_image: url };
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
    } catch (error) {
      console.error('Upload failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${message}`);
    } finally {
      setUpdating(null);
    }
  }

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, type);
  }

  const handleDeliveryFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setDeliveryFiles((prev) => [...prev, ...files]);
    event.target.value = '';
  };

  const handleRemoveDeliveryFile = (index: number) => {
    setDeliveryFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  function handlePostTypeSelection(type: CreatorPost['post_type']) {
    setPostType(type);
    if (type !== 'video') setPostVideoUrl('');
    if (type !== 'image') {
      setPostImageFile(null);
      setPostImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }

  function handlePostImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPostImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
  }

  async function handlePostSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!creator) return;
    const trimmedCaption = postCaption.trim();
    const trimmedLink = postLinkUrl.trim();
    const trimmedVideo = postVideoUrl.trim();
    const tagList = postTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (postType === 'image' && !postImageFile) {
      pushToast({ type: 'error', title: 'Image required', message: 'Select an image before posting.' });
      return;
    }
    if (postType === 'video' && !trimmedVideo) {
      pushToast({ type: 'error', title: 'Video link missing', message: 'Add a YouTube or Vimeo link.' });
      return;
    }

    try {
      setPostSubmitting(true);
      let mediaUrl: string | null = null;
      let videoProvider: 'youtube' | 'vimeo' | null = null;
      let videoId: string | null = null;
      let videoUrl: string | null = null;

      if (postType === 'image' && postImageFile) {
        const resized = await resizeImage(postImageFile, POST_IMAGE_MAX_EDGE, POST_IMAGE_MAX_EDGE, 'image/webp', 0.82);
        const fileName = `${creator.id}/posts/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from(POST_IMAGE_BUCKET)
          .upload(fileName, resized, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
        if (uploadError) {
          throw new Error(uploadError.message || 'Image upload failed');
        }
        const { data: publicData } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(fileName);
        mediaUrl = publicData.publicUrl ? `${publicData.publicUrl}?v=${Date.now()}` : null;
      }

      if (postType === 'video') {
        const meta = extractVideoMeta(trimmedVideo);
        if (!meta) {
          pushToast({ type: 'error', title: 'Unsupported link', message: 'Only YouTube or Vimeo links are supported right now.' });
          return;
        }
        videoProvider = meta.provider;
        videoId = meta.id;
        videoUrl = getEmbedUrl(meta);
      }

      const newPost = await createCreatorPost({
        creator_id: creator.id,
        caption: trimmedCaption || null,
        post_type: postType,
        media_url: mediaUrl,
        video_url: videoUrl,
        video_provider: videoProvider,
        video_id: videoId,
        link_url: trimmedLink || null,
        tags: tagList,
        is_public: true
      });

      if (!newPost) {
        throw new Error('Unable to save post');
      }

      setPosts((prev) => [newPost, ...prev]);
      pushToast({ type: 'success', title: 'Post published', message: 'Your update is now live.' });
      closePostModal();
    } catch (error) {
      console.error('Post creation failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      pushToast({ type: 'error', title: 'Could not publish', message });
    } finally {
      setPostSubmitting(false);
    }
  }

  function handleDeletePost(postId: string) {
    if (!creator) return;
    setDeleteConfirmation({ show: true, type: 'post', id: postId, title: 'this post' });
  }

  function handleDeleteProduct(productId: string) {
    if (!creator) return;
    const product = creator.products.find(p => p.id === productId);
    setDeleteConfirmation({ show: true, type: 'product', id: productId, title: product?.title || 'this product' });
  }

  async function executeDelete() {
    if (!creator || !deleteConfirmation.show) return;
    const { type, id } = deleteConfirmation;
    
    // Close modal immediately or keep it open with loading state?
    // Let's close it and show pending state via existing state vars
    setDeleteConfirmation(prev => ({ ...prev, show: false }));

    try {
      if (type === 'post') {
        setDeletingPostId(id);
        const success = await deleteCreatorPost(creator.id, id);
        if (!success) throw new Error('Unable to delete post.');
        setPosts((prev) => prev.filter((post) => post.id !== id));
        pushToast({ type: 'success', title: 'Post deleted', message: 'The post has been removed.' });
      } else {
        setDeletingProductId(id);
        const success = await deleteProduct(creator.id, id);
        if (!success) throw new Error('Unable to delete product.');
        setCreator((prev) => {
          if (!prev) return prev;
          const filteredProducts = prev.products.filter((product) => product.id !== id);
          const realCount = filteredProducts.filter((product) => !product.id.startsWith('dummy-')).length;
          return {
            ...prev,
            products: filteredProducts,
            totalProducts: realCount > 0 ? realCount : filteredProducts.length
          };
        });
        pushToast({ type: 'success', title: 'Product deleted', message: 'The product has been removed.' });
      }
    } catch (error) {
      console.error(`Failed to delete ${type}`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      pushToast({ type: 'error', title: 'Delete failed', message });
    } finally {
      if (type === 'post') setDeletingPostId(null);
      else setDeletingProductId(null);
    }
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

  const sanitizeLayout = useCallback((input?: ProfileSectionKey[] | null) => {
    if (!input || !Array.isArray(input) || input.length === 0) return [...DEFAULT_SECTION_ORDER];
    const filtered = input.filter((section): section is ProfileSectionKey => (DEFAULT_SECTION_ORDER as string[]).includes(section));
    const merged = [...new Set([...filtered, ...DEFAULT_SECTION_ORDER])];
    return merged.slice(0, DEFAULT_SECTION_ORDER.length);
  }, []);

  useEffect(() => {
    setSectionOrder(sanitizeLayout(creator?.profile_section_order));
  }, [creator?.profile_section_order, sanitizeLayout]);

  const persistSectionOrder = useCallback(async (order: ProfileSectionKey[]) => {
    if (!creator || !isOwner) return;
    try {
      const { error } = await supabase.from('users').update({ profile_section_order: order }).eq('id', creator.id);
      if (error) throw error;
      setCreator(prev => prev ? { ...prev, profile_section_order: order } : prev);
    } catch (error) {
      console.error('Failed to save section order', error);
      pushToast({ type: 'error', title: 'Reorder failed', message: 'Could not save new layout. Please try again.' });
      setSectionOrder(sanitizeLayout(creator?.profile_section_order));
    }
  }, [creator, isOwner, pushToast, sanitizeLayout, setCreator]);

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

      if (!response.ok) throw new Error('Failed to send message');

      pushToast({ type: 'success', title: 'Message sent', message: 'Your message has been sent to the creator.' });
      setMessageBody('');
      setMessageOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      pushToast({ type: 'error', title: 'Send failed', message: 'Could not send message. Please try again.' });
    }
  };

  const latestPost = posts[0] ?? null;
  const latestPostEntry = latestPost ? buildActivityEntryFromPost(latestPost) : null;
  const latestPostLabel = latestPost
    ? latestPost.post_type === 'video'
      ? 'Latest Video'
      : latestPost.post_type === 'image'
        ? 'Latest Photo'
        : 'Latest Link'
    : 'Links';
  const secondaryPostEntries = posts.slice(1, 4).map((post) => ({ post, entry: buildActivityEntryFromPost(post) }));

  const handleDropSection = useCallback((targetId: ProfileSectionKey, dropAfter: boolean) => {
    if (!draggingSection || draggingSection === targetId || !isOwner) {
      setDraggingSection(null);
      return;
    }

    setSectionOrder((prev) => {
      if (!prev.includes(targetId) || !prev.includes(draggingSection)) return prev;
      const movingDown = prev.indexOf(draggingSection) < prev.indexOf(targetId);
      const shouldInsertAfter = dropAfter || movingDown;
      const withoutDragged = prev.filter((section) => section !== draggingSection);
      const targetIndex = withoutDragged.indexOf(targetId);
      if (targetIndex === -1) return prev;
      const insertIndex = shouldInsertAfter ? targetIndex + 1 : targetIndex;
      const next = [...withoutDragged];
      next.splice(insertIndex, 0, draggingSection);
      persistSectionOrder(next);
      return next;
    });
    setDraggingSection(null);
  }, [draggingSection, isOwner, persistSectionOrder]);

  const renderDragHandle = (id: ProfileSectionKey) => {
    if (!isOwner) return null;
    return (
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', id)
          setDraggingSection(id)
        }}
        onDragEnd={() => setDraggingSection(null)}
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        aria-label="Drag section"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
    )
  }

  const sectionDropHandlers = (id: ProfileSectionKey) => {
    if (!isOwner) return {};
    return {
      onDragOver: (event: React.DragEvent<HTMLElement>) => {
        if (!draggingSection || draggingSection === id) return;
        event.preventDefault();
      },
      onDrop: (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const dropAfter = event.clientY - rect.top > rect.height / 2;
        handleDropSection(id, dropAfter);
      }
    };
  }

  const renderSection = (id: ProfileSectionKey) => {
    const dragHighlight = draggingSection === id ? 'ring-2 ring-blue-200 shadow-xl' : ''
    switch (id) {
      case 'products':
        const productList = creator?.products ?? []
        
        const renderProduct = (p: Product) => {
          const images = Array.isArray(p.images) ? p.images.filter(Boolean) : []
          const videos = Array.isArray(p.videos) ? p.videos.filter(Boolean) : []
          const features = Array.isArray(p.features) ? p.features.filter(Boolean) : []
          const hasVideo = videos.length > 0
          const imageCount = images.length
          const featureCount = features.length
          const price = (typeof p.base_price === 'number' && p.base_price >= 0) ? p.base_price : undefined
          return (
            <Link href={`/product/${p.id}`} key={p.id} prefetch className="group block h-full">
              <div className="relative border dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 h-full">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs overflow-hidden">
                  {imageCount > 0 ? (
                    <>
                      <Image
                        src={images[0]}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                      {/* Second image on hover */}
                      {images[1] && (
                        <Image
                          src={images[1]}
                          alt={p.title}
                          fill
                          className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      )}
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">No media yet</div>
                  )}
                  {/* Share button - appears on hover */}
                  <button type="button" onClick={(e)=>{e.preventDefault(); setShareProduct({ url: `${window.location.origin}/product/${p.id}`, title: p.title });}}
                    className="absolute right-2 top-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110">
                    <ShareIcon fontSize="small" className="w-4 h-4" />
                  </button>
                  {isOwner && !p.id.startsWith('dummy-') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (!deletingProductId || deletingProductId === p.id) {
                          handleDeleteProduct(p.id)
                        }
                      }}
                      disabled={deletingProductId === p.id}
                      className="absolute left-2 top-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full px-2.5 py-1 text-xs shadow-lg disabled:opacity-60 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                    >
                      {deletingProductId === p.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                  {p.status === 'pending' && (
                     <span className="absolute left-2 top-10 bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-medium shadow z-10">
                      Pending
                    </span>
                  )}
                  {/* Quick view bar - slides up on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-1">
                    View Details
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{p.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {hasVideo && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1"><PlayCircleIcon className="h-3 w-3"/>Video</span>
                      )}
                      {imageCount > 1 && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1">{imageCount} Images</span>
                      )}
                    </div>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{price !== undefined ? `$${price.toLocaleString()}` : 'Free'}</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        }

        return (
          <section
            key="products"
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition ${dragHighlight}`}
            {...sectionDropHandlers('products')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {renderDragHandle('products')}
                <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
                  Featured Products
                  <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{creator?.totalProducts ?? 0}</span>
                </h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 inline-flex items-center gap-1"
                >
                  {showAllProducts ? 'Show Less' : 'View All'}
                </button>
                {isOwner && (
                  <button onClick={() => {
                    if (adminSettings.require_verification && !creator?.is_verified) {
                      pushToast({ type: 'error', title: 'Verification Required', message: 'You must be verified to create products.' });
                      return;
                    }
                    setAddProductOpen(true);
                  }} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"><AddCircleOutlineIcon fontSize="small"/>Add Product</button>
                )}
              </div>
            </div>
            
            {productList.length === 0 ? (
              <p className="text-sm text-gray-500">No products yet.</p>
            ) : showAllProducts ? (
              <div className="grid gap-5 md:grid-cols-3">
                {productList.map(p => renderProduct(p))}
              </div>
            ) : (
              <div className="flex gap-5 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-6 px-6">
                {productList.map(p => (
                  <div key={p.id} className="min-w-[280px] md:min-w-[320px] snap-center first:pl-6 last:pr-6">
                    {renderProduct(p)}
                  </div>
                ))}
              </div>
            )}
            
            {shareProduct && (
              <ShareModal isOpen={!!shareProduct} onClose={()=>setShareProduct(null)} url={shareProduct.url} title={shareProduct.title} />
            )}
          </section>
        )
      case 'reviews':
        return (
          <section
            key="reviews"
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition ${dragHighlight}`}
            {...sectionDropHandlers('reviews')}
          >
            <div className="flex items-center gap-2 mb-4">
              {renderDragHandle('reviews')}
              <h2 className="text-xl font-semibold dark:text-white">Customer Reviews</h2>
            </div>
            <ReviewsSlider creatorId={creator?.id || ''} />
          </section>
        )
      case 'links':
        return (
          <section
            key="links"
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition ${dragHighlight}`}
            {...sectionDropHandlers('links')}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  {renderDragHandle('links')}
                  <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
                    Links
                    {latestPost && (
                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        {latestPostLabel}
                        <span>
                          {new Date(latestPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </span>
                    )}
                  </h2>
                </div>
                {latestPostEntry?.extra && latestPost?.post_type === 'text' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{latestPostEntry.extra}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAllPosts(!showAllPosts)}
                  className="px-3 py-1.5 text-sm rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white inline-flex items-center gap-1"
                >
                  {showAllPosts ? 'Show Less' : 'View All'}
                </button>
                {isOwner && (
                  <>
                    {!showAllPosts && latestPost && (
                      <button
                        onClick={() => handleDeletePost(latestPost.id)}
                        disabled={deletingPostId === latestPost.id}
                        className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingPostId === latestPost.id ? 'Deleting…' : 'Delete Post'}
                      </button>
                    )}
                    <button
                      onClick={() => { resetPostForm(); setAddPostOpen(true); }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                    >
                      <AddCircleOutlineIcon fontSize="small"/>Add Post
                    </button>
                  </>
                )}
              </div>
            </div>

            {postsLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading recent posts…</div>
            ) : !latestPost ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-300">
                {isOwner ? (
                  <div className="space-y-3">
                    <p>Add your favorite links, updates, or embeds to showcase your work.</p>
                    <button
                      onClick={() => { resetPostForm(); setAddPostOpen(true); }}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <AddCircleOutlineIcon fontSize="inherit"/>Share your first link
                    </button>
                  </div>
                ) : (
                  <p>{creator?.full_name} hasn’t shared anything yet.</p>
                )}
              </div>
            ) : showAllPosts ? (
              <div className="grid gap-6 md:grid-cols-3">
                {posts.map((post) => {
                  const entry = buildActivityEntryFromPost(post);
                  return (
                    <article key={post.id} className="rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 rounded-full border dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-0.5 capitalize text-gray-700 dark:text-gray-300">{post.post_type}</span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          {isOwner && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deletingPostId === post.id}
                              className="px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              {deletingPostId === post.id ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold line-clamp-2 dark:text-white">{entry.title}</div>
                      {post.post_type === 'image' && entry.imageUrl && (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" sizes="200px" />
                        </div>
                      )}
                      {post.post_type === 'video' && entry.embedUrl && (
                        <div className="aspect-video overflow-hidden rounded-lg bg-black/5 dark:bg-black/40">
                          <iframe
                            src={entry.embedUrl}
                            className="h-full w-full"
                            frameBorder={0}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {post.post_type === 'text' && entry.extra && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-line">{entry.extra}</p>
                      )}
                      {entry.link && (
                        <a href={entry.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline break-words">
                          <LinkIcon className="h-3 w-3"/>{entry.link}
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-3">
                  {latestPost.post_type === 'video' && latestPostEntry?.embedUrl && (
                    <div className="aspect-video overflow-hidden rounded-xl bg-black/5 dark:bg-black/40">
                      <iframe
                        src={latestPostEntry.embedUrl}
                        className="h-full w-full"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {latestPost.post_type === 'image' && latestPost.media_url && (
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Image src={latestPost.media_url} alt={latestPostEntry?.title || 'Creator post'} fill className="object-cover" sizes="(min-width: 768px) 60vw, 100vw" />
                    </div>
                  )}
                  {latestPost.post_type === 'text' && latestPostEntry?.extra && (
                    <div className="rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {latestPostEntry.extra}
                    </div>
                  )}
                  {latestPost.post_type !== 'text' && latestPostEntry?.extra && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{latestPostEntry.extra}</p>
                  )}
                  {latestPost.link_url && (
                    <a
                      href={latestPost.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline break-words"
                    >
                      <LinkIcon className="h-4 w-4"/>{latestPost.link_url}
                    </a>
                  )}
                  {latestPost.tags && latestPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {latestPost.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-700 dark:text-gray-300">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {secondaryPostEntries.length === 0 ? (
                    <div className="rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4 text-sm text-gray-500 dark:text-gray-300">No other links yet.</div>
                  ) : (
                    secondaryPostEntries.map(({ post, entry }) => (
                      <article key={post.id} className="rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1 rounded-full border dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-0.5 capitalize text-gray-700 dark:text-gray-300">{post.post_type}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            {isOwner && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                disabled={deletingPostId === post.id}
                                className="px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                              >
                                {deletingPostId === post.id ? 'Deleting…' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold line-clamp-2 dark:text-white">{entry.title}</div>
                        {post.post_type === 'image' && entry.imageUrl && (
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" sizes="200px" />
                          </div>
                        )}
                        {post.post_type === 'video' && entry.embedUrl && (
                          <div className="aspect-video overflow-hidden rounded-lg bg-black/5 dark:bg-black/40">
                            <iframe
                              src={entry.embedUrl}
                              className="h-full w-full"
                              frameBorder={0}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        )}
                        {post.post_type === 'text' && entry.extra && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-line">{entry.extra}</p>
                        )}
                        {entry.link && (
                          <a href={entry.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline break-words">
                            <LinkIcon className="h-3 w-3"/>{entry.link}
                          </a>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        )
      default:
        return null
    }
  }

  // Load creator posts for the Links section
  useEffect(() => {
    if (!creator) return;
    let cancelled = false;
    setPostsLoading(true);
    (async () => {
      try {
        const postsData = await fetchCreatorPosts(creator.id, 18);
        if (!cancelled) setPosts(postsData);
      } catch (e) {
        if (!cancelled) {
          console.warn('Posts load failed', e);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creator, buildActivityEntryFromPost]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">Loading…</div>;
  if (!creator) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">Creator not found.</div>;

  // Get unique product images for mosaic banner
  const bannerImages = (creator.products ?? [])
    .flatMap(p => p.images || [])
    .filter(Boolean)
    .slice(0, 12);

  // Get product type counts for sidebar filters
  const productTypeCounts = {
    all: (creator.products ?? []).length,
    product: (creator.products ?? []).filter(p => p.type === 'product').length,
    service: (creator.products ?? []).filter(p => p.type === 'service').length,
  };

  const memberSince = new Date(creator.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  const yearsOnPlatform = Math.max(0.1, (Date.now() - new Date(creator.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Cover Banner - Show cover image if available, otherwise use product mosaic or gradient */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-100 dark:bg-gray-800 group">
        {creator.background_image ? (
          <Image src={creator.background_image} alt="Cover" fill className="object-cover" sizes="100vw" priority />
        ) : bannerImages.length >= 4 ? (
          <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 grid-rows-2 gap-0.5">
            {bannerImages.slice(0, 8).map((img, i) => (
              <div 
                key={i} 
                className={`relative overflow-hidden ${
                  i === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="20vw" />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
        )}
        {isOwner && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center text-white text-xs gap-2 transform hover:scale-105 transition-transform">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CameraIcon className="h-6 w-6" />
              </div>
              <span className="font-medium">{updating === 'cover' ? 'Uploading…' : 'Change Cover'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e)=>onSelectFile(e,'cover')} disabled={updating==='cover'} />
            </label>
          </div>
        )}
      </div>

      {/* Compact Profile Header - Etsy Style */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Avatar */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-lg shrink-0 bg-gray-100 dark:bg-gray-700 group/avatar -mt-12 md:-mt-16">
              {creator.avatar_url ? (
                <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover" sizes="96px" />
              ) : (
                <UserCircleIcon className="h-full w-full text-gray-300" />
              )}
              {isOwner && (
                <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer text-white transition-opacity">
                  <PhotoCameraFrontIcon fontSize="small" />
                  <input type="file" accept="image/*" className="hidden" disabled={updating==='avatar'} onChange={(e)=>onSelectFile(e,'avatar')} />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{creator.full_name}</h1>
                {creator.is_verified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                )}
              </div>
              {creator.location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{creator.location}</p>
              )}
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">5.0</span>
                  <span className="text-gray-500 dark:text-gray-400">(0)</span>
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{creator.totalProducts || 0}</span> sales
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{yearsOnPlatform}</span> years on FormKart
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (!currentUser) { router.push(`/auth/login?redirect=/creator/${creator.username}?contact=1`); } else { setMessageOpen(true); } }}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Contact
              </button>
              <button
                onClick={() => setSubscribeOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                Follow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Etsy Style */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white">
                Items
              </button>
              <Link href={`/creator/${creator.username}/bio`} className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 transition-colors">
                About
              </Link>
              <button className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 transition-colors">
                Reviews
              </button>
            </div>
            {/* Search within shop */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder={`Search all ${creator.totalProducts || 0} items`}
                className="w-64 pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar - Etsy Style */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            {/* Category Filters */}
            <div className="mb-6">
              <button className={`w-full text-left py-2 text-sm font-medium flex items-center justify-between ${!showAllProducts ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                All
                <span className="text-gray-400">{productTypeCounts.all}</span>
              </button>
              <button className="w-full text-left py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-between">
                Digital Products
                <span className="text-gray-400">{productTypeCounts.product}</span>
              </button>
              <button className="w-full text-left py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-between">
                Services
                <span className="text-gray-400">{productTypeCounts.service}</span>
              </button>
            </div>

            {/* Contact Button */}
            <button
              onClick={() => { if (!currentUser) { router.push(`/auth/login?redirect=/creator/${creator.username}?contact=1`); } else { setMessageOpen(true); } }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Contact shop owner
            </button>

            {/* Shop Stats */}
            <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
              <a href="#" className="block hover:text-gray-900 dark:hover:text-white underline">{creator.totalProducts || 0} Sales</a>
              <a href="#" className="block hover:text-gray-900 dark:hover:text-white underline">0 Admirers</a>
            </div>

            {/* Report Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                Report this shop
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 w-full min-w-0">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-900 dark:bg-white rounded-full"></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {showAllProducts ? 'All items' : 'Featured items'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && (
                  <button 
                    onClick={() => {
                      if (adminSettings.require_verification && !creator?.is_verified) {
                        pushToast({ type: 'error', title: 'Verification Required', message: 'You must be verified to create products.' });
                        return;
                      }
                      setAddProductOpen(true);
                    }} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                    Add Product
                  </button>
                )}
                <div className="relative">
                  <select className="appearance-none text-sm border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors cursor-pointer">
                    <option>Sort: Most Recent</option>
                    <option>Sort: Price Low to High</option>
                    <option>Sort: Price High to Low</option>
                    <option>Sort: Top Rated</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
            {/* Products Grid - Etsy Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {(showAllProducts ? (creator.products ?? []) : (creator.products ?? []).slice(0, 8)).map(p => {
                const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
                const price = (typeof p.base_price === 'number' && p.base_price >= 0) ? p.base_price : undefined;
                return (
                  <Link href={`/product/${p.id}`} key={p.id} className="group block">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                      {/* Product Image - Tall like Etsy */}
                      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {images[0] ? (
                          <>
                            <Image
                              src={images[0]}
                              alt={p.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                            />
                            {/* Second image on hover */}
                            {images[1] && (
                              <Image
                                src={images[1]}
                                alt={p.title}
                                fill
                                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        {/* Add to Cart button */}
                        <button
                          onClick={async (e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            try {
                              const success = await addToCart({ product_id: p.id, quantity: 1, package_id: '' });
                              if (success) {
                                pushToast({ type: 'success', title: 'Added to Cart', message: `${p.title} added to cart` });
                              }
                            } catch (err) {
                              console.error('Add to cart failed', err);
                              pushToast({ type: 'error', title: 'Error', message: 'Failed to add to cart' });
                            }
                          }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-white dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                          title="Add to Cart"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </button>
                        {/* Delete button for owner */}
                        {isOwner && !p.id.startsWith('dummy-') && (
                          <button
                            onClick={(e) => { e.preventDefault(); handleDeleteProduct(p.id); }}
                            disabled={deletingProductId === p.id}
                            className="absolute top-2 left-2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        {/* Pending badge */}
                        {p.status === 'pending' && (
                          <span className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">Pending</span>
                        )}
                      </div>
                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {p.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-gray-900 dark:text-white">
                            ${price !== undefined ? price.toLocaleString() : '0'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 capitalize">
                            {p.type === 'service' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Service</>
                            ) : p.type === 'course' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> Course</>
                            ) : p.type === 'consultation' ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> Consultation</>
                            ) : (
                              <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/></svg> Digital Product</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* View All Button */}
            {!showAllProducts && (creator.products ?? []).length > 8 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAllProducts(true)}
                  className="px-6 py-3 border border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  View all {(creator.products ?? []).length} items
                </button>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reviews</h2>
              <ReviewsSlider creatorId={creator.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
  {isOwner && addProductOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2"><AddCircleOutlineIcon fontSize="small"/> Create New Product</h3>
              <button onClick={()=>{setAddProductOpen(false); setMediaFiles([]); setDeliveryFiles([]);}} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
                    if (files.length) {
                      if (mediaFiles.length + files.length > adminSettings.max_images_per_product) {
                        pushToast({ type: 'error', title: 'Limit Exceeded', message: `You can only upload up to ${adminSettings.max_images_per_product} images per product.` });
                        return;
                      }
                      setMediaFiles(prev => [...prev, ...files]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              {mediaFiles.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Selected ({mediaFiles.length})</div>
                  <ul className="space-y-2 max-h-40 overflow-auto">
                    {mediaFiles.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 border rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors">
                        <ImagePreview file={f} />
                        <span className="text-xs truncate flex-1 font-medium text-gray-700">{f.name}</span>
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
              {/* Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => { setSelectedCategoryId(e.target.value); setSelectedSubcategoryId(''); }}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subcategory</label>
                  <select
                    value={selectedSubcategoryId}
                    onChange={e => setSelectedSubcategoryId(e.target.value)}
                    disabled={!selectedCategoryId}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Subcategory</option>
                    {categories.find(c => c.id === selectedCategoryId)?.children?.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Common extra fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Promo YouTube Video</label>
                  <input value={productExtras.videoUrl} onChange={e=>setProductExtras(x=>({...x,videoUrl:e.target.value}))} placeholder="https://youtu.be/.. or ID" className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">External / Demo Link</label>
                  <input value={productExtras.externalUrl} onChange={e=>setProductExtras(x=>({...x,externalUrl:e.target.value}))} placeholder="https://example.com" className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags (max 5, up to 20 chars each)</label>
                <input 
                  value={productExtras.tags} 
                  onChange={e=>setProductExtras(x=>({...x,tags:e.target.value}))} 
                  placeholder="branding, logo, design" 
                  className={`w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white ${
                    (productExtras.tags.split(',').filter(t => t.trim()).length > 5 || productExtras.tags.split(',').some(t => t.trim().length > 20)) 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'dark:border-gray-600'
                  }`} 
                />
                {(productExtras.tags.split(',').filter(t => t.trim()).length > 5 || productExtras.tags.split(',').some(t => t.trim().length > 20)) && (
                  <p className="text-xs text-red-500 mt-1">
                    {productExtras.tags.split(',').filter(t => t.trim()).length > 5 && 'Max 5 tags allowed. '}
                    {productExtras.tags.split(',').some(t => t.trim().length > 20) && 'Tags must be under 20 characters.'}
                  </p>
                )}
              </div>
              {(selectedType==='digital' || selectedType==='course') && (
                <div className="border dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Deliverable Files</label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Attach PDFs, ZIPs, or resources that buyers get instantly after payment.</p>
                    </div>
                    <label className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                      Upload files
                      <input type="file" multiple className="hidden" onChange={handleDeliveryFileInput} />
                    </label>
                  </div>
                  {deliveryFiles.length > 0 ? (
                    <ul className="space-y-2 max-h-36 overflow-auto text-xs">
                      {deliveryFiles.map((file, idx) => (
                        <li key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                          <div className="flex-1 truncate pr-2">
                            <p className="font-medium truncate dark:text-white">{file.name}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={()=>handleRemoveDeliveryFile(idx)} className="text-[11px] text-red-600 dark:text-red-400 hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No files selected yet.</p>
                  )}
                  {deliveryFiles.length > 0 && (
                    <div className="text-right">
                      <button type="button" onClick={()=>setDeliveryFiles([])} className="text-xs text-red-600 dark:text-red-400 hover:underline">Clear all</button>
                    </div>
                  )}
                </div>
              )}
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
                  <div className="md:col-span-3">
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={productExtras.consultationLiveEnabled}
                        onChange={(e)=>setProductExtras(x=>({...x,consultationLiveEnabled:e.target.checked}))}
                        className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                      />
                      <span>
                        Enable live call (video / voice)
                        <span className="block text-[11px] text-gray-500">If enabled, buyers can schedule a live session with you.</span>
                      </span>
                    </label>
                    {productExtras.consultationLiveEnabled && (
                      <div className="mt-3 grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Call Type</label>
                          <select value={productExtras.consultationCallType} onChange={e=>setProductExtras(x=>({...x,consultationCallType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                            <option value="">Select</option>
                            <option value="video">Video</option>
                            <option value="voice">Voice</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Provider / Notes</label>
                          <input value={productExtras.consultationProvider} onChange={e=>setProductExtras(x=>({...x,consultationProvider:e.target.value}))} placeholder="Zoom link / provider info" className="w-full border rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Service specific */}
              {selectedType==='service' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Duration</label>
                    <input value={productExtras.serviceDuration} onChange={e=>setProductExtras(x=>({...x,serviceDuration:e.target.value}))} placeholder="e.g. 2 hours" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Availability</label>
                    <input value={productExtras.serviceAvailability} onChange={e=>setProductExtras(x=>({...x,serviceAvailability:e.target.value}))} placeholder="Weekdays, Evenings" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location / Booking URL</label>
                    <input value={productExtras.externalUrl} onChange={e=>setProductExtras(x=>({...x,externalUrl:e.target.value}))} placeholder="In-person location or booking URL" className="w-full border rounded-lg px-3 py-2 text-sm" />
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Course Access Links</label>
                      <textarea value={productExtras.courseAccessLinks} onChange={e=>setProductExtras(x=>({...x,courseAccessLinks:e.target.value}))} placeholder="https://portal.example.com/class\nhttps://community.example.com" className="w-full border rounded-lg px-3 py-2 text-sm h-28" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Passkeys / Codes</label>
                      <textarea value={productExtras.coursePasskeys} onChange={e=>setProductExtras(x=>({...x,coursePasskeys:e.target.value}))} placeholder="Batch-2025-Key\nVIP-ACCESS-123" className="w-full border rounded-lg px-3 py-2 text-sm h-28" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Access Notes</label>
                    <textarea value={productExtras.courseAccessNotes} onChange={e=>setProductExtras(x=>({...x,courseAccessNotes:e.target.value}))} placeholder="Share how learners unlock the content or who to contact for support." className="w-full border rounded-lg px-3 py-2 text-sm h-24" />
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
              <button onClick={()=>{setAddProductOpen(false); setAutoMessageEnabled(false); setAutoMessage(''); setMediaFiles([]); setDeliveryFiles([]);}} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
              <button disabled={savingProduct || !newProduct.title} onClick={async ()=>{
                if (!creator || !newProduct.title) return;
                setSavingProduct(true);
                try {
                  let insertedId = `local-${Date.now()}`;
                  const priceNum = parseFloat(newProduct.price||'0');
                  // Build dynamic arrays - limit to 5 tags, max 20 chars each
                  const tagArray = (productExtras.tags || '').split(',').map(t=>t.trim().slice(0,20)).filter(Boolean).slice(0,5);
                  const youTubeMatch = productExtras.videoUrl ? (productExtras.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) || productExtras.videoUrl.match(/^([A-Za-z0-9_-]{6,})$/)) : null;
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
                    if (productExtras.consultationLiveEnabled) featureLines.push(`Live call: ${productExtras.consultationCallType || 'enabled'}`);
                    if (productExtras.consultationProvider) featureLines.push(`Provider: ${productExtras.consultationProvider}`);
                  } else if (selectedType==='service') {
                    if (productExtras.serviceDuration) featureLines.push(`Duration: ${productExtras.serviceDuration}`);
                    if (productExtras.serviceAvailability) featureLines.push(`Availability: ${productExtras.serviceAvailability}`);
                  } else if (selectedType==='course') {
                    if (productExtras.courseModules) featureLines.push(`Modules: ${productExtras.courseModules}`);
                    if (productExtras.courseHours) featureLines.push(`Hours: ${productExtras.courseHours}`);
                    if (productExtras.courseLevel) featureLines.push(`Level: ${productExtras.courseLevel}`);
                  }
                  const requirements: string[] = [];
                  if (productExtras.externalUrl) requirements.push(`External: ${productExtras.externalUrl}`);
                  if (selectedType==='digital' && productExtras.downloadUrl) requirements.push(`Download: ${productExtras.downloadUrl}`);
                  if (selectedType==='course' && productExtras.courseCurriculum) requirements.push(`Curriculum: ${productExtras.courseCurriculum.slice(0,400)}`);
                  
                  // Map selection to specific types
                  const typeMapping: Record<string, 'product'|'service'|'course'|'consultation'> = { 
                    digital: 'product', 
                    consultation: 'consultation', 
                    service: 'service', 
                    course: 'course' 
                  };
                  
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
                  let digitalAssets: ProductDigitalAsset[] = [];
                  let digitalUploadFailed = false;
                  if ((selectedType === 'digital' || selectedType === 'course') && deliveryFiles.length) {
                    const digitalTasks = deliveryFiles.map(async (file, idx) => {
                      try {
                        const stamp = Date.now() + idx;
                        const rand = Math.random().toString(36).slice(2, 8);
                        const path = `${creator.id}/${slug}/files/${stamp}-${rand}-${encodeURIComponent(file.name)}`;
                        const bucket = 'digital-products';
                        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
                        if (upErr) throw upErr;
                        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
                        return {
                          name: file.name,
                          url: `${pub.publicUrl}?v=${stamp}`,
                          size: file.size,
                          type: file.type || undefined
                        } satisfies ProductDigitalAsset;
                      } catch (digitalErr) {
                        console.warn('Digital deliverable upload failed', digitalErr);
                        if (!digitalUploadFailed) {
                          pushToast({ type: 'error', title: 'Attachment upload skipped', message: 'Unable to upload one of the deliverable files. The rest will continue.' });
                          digitalUploadFailed = true;
                        }
                        return null;
                      }
                    });
                    const uploadedAssets = await Promise.all(digitalTasks);
                    digitalAssets = uploadedAssets.filter(Boolean) as ProductDigitalAsset[];
                  }

                  let courseDeliveryPayload: CourseDeliveryPayload | null = null;
                  if (selectedType === 'course') {
                    const linkList = productExtras.courseAccessLinks.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
                    const passkeyList = productExtras.coursePasskeys.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
                    const notes = productExtras.courseAccessNotes.trim();
                    if (linkList.length || passkeyList.length || notes) {
                      courseDeliveryPayload = {
                        links: linkList.length ? linkList : undefined,
                        passkeys: passkeyList.length ? passkeyList : undefined,
                        notes: notes || undefined
                      };
                    }
                  }

                  const resolvedPrice = Number.isFinite(priceNum) ? priceNum : 0;
                  // Always use 'active' status to avoid constraint issues with older databases
                  const productStatus = 'active' as const;
                  const insertPayload: NewProductInsert = {
                    title: newProduct.title,
                    description: newProduct.description,
                    base_price: resolvedPrice,
                    creator_id: creator.id,
                    type: typeMapping[selectedType] ?? 'product',
                    slug,
                    features: featureLines,
                    requirements,
                    tags: tagArray,
                    videos: videoId ? [videoId] : [],
                    images: imageUrls,
                    auto_message_enabled: autoMessageEnabled,
                    auto_message: autoMessageEnabled ? autoMessage : null,
                    status: productStatus,
                    digital_files: digitalAssets.length ? digitalAssets : null,
                    course_delivery: courseDeliveryPayload,
                    auto_deliver: selectedType === 'digital' || selectedType === 'course',
                    is_digital: selectedType === 'digital',
                    category_id: selectedCategoryId || null,
                    subcategory_id: selectedSubcategoryId || null
                  };
                  const { data, error } = await supabase
                    .from('products')
                    .insert(insertPayload)
                    .select('id,created_at,features,requirements,tags,videos,images');
                  if (error) throw error;
                  const insertedRowCandidate: unknown = Array.isArray(data) ? data[0] : data;
                  const insertedRow = isProductInsertRow(insertedRowCandidate) ? insertedRowCandidate : null;
                  if (insertedRow) {
                    insertedId = insertedRow.id;
                  }
                  const created_at = insertedRow?.created_at ?? new Date().toISOString();
                  const resolvedFeatures = insertedRow?.features ?? featureLines;
                  const resolvedVideos = insertedRow?.videos ?? (videoId ? [videoId] : []);
                  const resolvedImages = imageUrls.length > 0 ? imageUrls : (insertedRow?.images ?? []);
                  if (!insertedId.startsWith('local-')) {
                    try {
                      const defaultPackage: ProductPackageInsert = {
                        product_id: insertedId,
                        name: 'Standard',
                        description: newProduct.description?.slice(0, 160) || 'Standard package',
                        price: resolvedPrice,
                        delivery_time: 3,
                        revisions: 1,
                        features: resolvedFeatures,
                        sort_order: 1
                      };
                      await supabase.from('product_packages').insert(defaultPackage);
                    } catch (packageError) {
                      console.warn('Default package create failed', packageError);
                    }
                  }
                  const productObj: Product = {
                    id: insertedId,
                    title: newProduct.title,
                    description: newProduct.description,
                    created_at,
                    images: resolvedImages,
                    videos: resolvedVideos,
                    features: resolvedFeatures,
                    base_price: Number.isFinite(priceNum) ? priceNum : undefined,
                    auto_message_enabled: autoMessageEnabled,
                    auto_message: autoMessageEnabled ? autoMessage : null,
                    status: adminSettings.auto_approve_products ? 'active' : 'pending',
                    type: typeMapping[selectedType] ?? 'product'
                  };
                  setCreator(prev => prev ? { ...prev, products: [productObj, ...prev.products], totalProducts: prev.totalProducts + 1 } : prev);
                  
                  if (!adminSettings.auto_approve_products) {
                    pushToast({ type: 'success', title: 'Submitted for Review', message: 'Your product is pending approval.' });
                  } else {
                    pushToast({ type: 'success', title: 'Product Created', message: 'Your product is now live.' });
                  }

                  setNewProduct({ title:'', description:'', price:'' });
                  setProductExtras({
                    videoUrl:'',
                    externalUrl:'',
                    tags:'',
                    fileFormat:'',
                    downloadUrl:'',
                    fileSize:'',
                    licenseType:'',
                    consultationDuration:'',
                    consultationMethod:'',
                    consultationAvailability:'',
                    consultationLiveEnabled: false,
                    consultationCallType: '',
                    consultationProvider: '',
                    serviceDuration: '',
                    serviceAvailability: '',
                    courseModules:'',
                    courseHours:'',
                    courseCurriculum:'',
                    courseLevel:'',
                    courseAccessLinks:'',
                    coursePasskeys:'',
                    courseAccessNotes:''
                  });
                  setAutoMessageEnabled(false);
                  setAutoMessage('');
                  setMediaFiles([]);
                  setDeliveryFiles([]);
                  setSelectedCategoryId('');
                  setSelectedSubcategoryId('');
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
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5">
            <div className="flex justify-end">
              <button onClick={()=>setSubscribeOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            <div className="flex flex-col items-center text-center -mt-8">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow mb-3 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {creator.avatar_url ? (
                  <Image
                    src={creator.avatar_url}
                    alt={creator.full_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <UserCircleIcon className="h-12 w-12 text-gray-300"/>
                )}
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Subscribe to {creator.username}</h3>
              <form onSubmit={async e=>{e.preventDefault(); if(!subscribeEmail) return; setSubscribing(true); try { await supabase.from('newsletter_subscriptions').insert({ creator_id: creator.id, email: subscribeEmail, source: 'creator_profile' }); setSubscribeEmail(''); setSubscribeOpen(false); } catch(err){ console.warn('Subscribe failed', err);} finally { setSubscribing(false);} }} className="w-full flex rounded-lg overflow-hidden border dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
                <input type="email" required placeholder="Sign Up" value={subscribeEmail} onChange={e=>setSubscribeEmail(e.target.value)} className="flex-1 px-3 py-2 text-sm outline-none dark:bg-gray-700 dark:text-white" />
                <button disabled={subscribing} className="px-4 bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium hover:bg-black dark:hover:bg-gray-600 disabled:opacity-50">{subscribing? '...' : 'Submit'}</button>
              </form>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">We respect your inbox. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      )}
      {/* Message Modal */}
  {messageOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold dark:text-white">Message {creator.full_name}</h3>
              <button onClick={()=>setMessageOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            <textarea value={messageBody} onChange={e=>setMessageBody(e.target.value)} placeholder="Write your message..." className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm h-40 dark:bg-gray-700 dark:text-white" />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setMessageOpen(false)} className="px-3 py-2 text-sm rounded border dark:border-gray-600 dark:text-white">Cancel</button>
              <button onClick={handleSendMessage} disabled={!messageBody.trim()} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Send</button>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
  {isOwner && settingsOpen && creator && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-2xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Profile Settings</h3>
              <button onClick={()=>setSettingsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bio</label>
                <textarea value={settings.bio} onChange={e=>setSettings(s=>({...s,bio:e.target.value}))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm h-24 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Website</label>
                  <input value={settings.website} onChange={e=>setSettings(s=>({...s,website:e.target.value}))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Location</label>
                  <input value={settings.location} onChange={e=>setSettings(s=>({...s,location:e.target.value}))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input placeholder="Twitter" value={settings.twitter} onChange={e=>setSettings(s=>({...s,twitter:e.target.value}))} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                <input placeholder="Instagram" value={settings.instagram} onChange={e=>setSettings(s=>({...s,instagram:e.target.value}))} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                <input placeholder="YouTube" value={settings.youtube} onChange={e=>setSettings(s=>({...s,youtube:e.target.value}))} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                <input placeholder="Facebook" value={settings.facebook} onChange={e=>setSettings(s=>({...s,facebook:e.target.value}))} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                <input placeholder="LinkedIn" value={settings.linkedin} onChange={e=>setSettings(s=>({...s,linkedin:e.target.value}))} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm md:col-span-2 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setSettingsOpen(false)} className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 dark:text-white">Cancel</button>
              <button onClick={async ()=>{
                const socialEntries = {
                  twitter: settings.twitter,
                  instagram: settings.instagram,
                  youtube: settings.youtube,
                  facebook: settings.facebook,
                  linkedin: settings.linkedin,
                };
                const socialLinks = Object.entries(socialEntries).reduce<Record<string, string>>((acc, [key, value]) => {
                  if (value) acc[key] = value;
                  return acc;
                }, {});
                const updates: CreatorProfileUpdate = {
                  bio: settings.bio,
                  website: settings.website,
                  location: settings.location,
                  social_links: socialLinks,
                };
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur flex items-start justify-center z-50 overflow-y-auto py-10 px-4">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">Share a new post</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Drop a quick update, image, or video for your audience.</p>
              </div>
              <button type="button" onClick={closePostModal} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              {(['text', 'image', 'video'] as CreatorPost['post_type'][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePostTypeSelection(type)}
                  className={`rounded-lg border px-3 py-2 font-medium capitalize transition ${postType === type ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                  disabled={postSubmitting}
                >
                  {type}
                </button>
              ))}
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                <textarea
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  rows={4}
                  placeholder={postType === 'text' ? 'Tell your audience what’s new…' : 'Add a caption'}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={postSubmitting}
                />
              </div>

              {postType === 'video' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Video link</label>
                  <input
                    value={postVideoUrl}
                    onChange={(e) => setPostVideoUrl(e.target.value)}
                    placeholder="YouTube or Vimeo link"
                    className="w-full rounded-lg border dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={postSubmitting}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">We support public YouTube and Vimeo links.</p>
                </div>
              )}

              {postType === 'image' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Image</span>
                    {postImagePreview && (
                      <button
                        type="button"
                        className="text-red-500 hover:underline"
                        onClick={() => {
                          setPostImageFile(null);
                          setPostImagePreview((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                        }}
                        disabled={postSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {postImagePreview ? (
                    <div className="relative aspect-square overflow-hidden rounded-xl border">
                      <Image src={postImagePreview} alt="Post preview" fill className="object-cover" sizes="(min-width: 768px) 400px, 90vw" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-sm text-gray-500 cursor-pointer hover:bg-gray-100">
                      <span>Tap to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePostImageInput}
                        disabled={postSubmitting}
                      />
                    </label>
                  )}
                  <p className="text-[11px] text-gray-500">High-res photos work best. We compress to keep loading fast.</p>
                </div>
              )}

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Optional link</label>
                  <input
                    value={postLinkUrl}
                    onChange={(e) => setPostLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={postSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags</label>
                  <input
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    placeholder="launch, behind-the-scenes"
                    className="w-full rounded-lg border dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={postSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closePostModal} className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 dark:text-white" disabled={postSubmitting}>Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={postSubmitting || (postType === 'image' && !postImageFile)}
                >
                  {postSubmitting ? 'Publishing…' : 'Publish' }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete {deleteConfirmation.type === 'post' ? 'Post' : 'Product'}?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-200">"{deleteConfirmation.title}"</span>?
                <br/>This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setDeleteConfirmation(prev => ({ ...prev, show: false }))}
                className="flex-1 p-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={!!deletingPostId || !!deletingProductId}
              >
                Cancel
              </button>
              <div className="w-px bg-gray-100 dark:border-gray-700"></div>
              <button 
                onClick={executeDelete}
                className="flex-1 p-4 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                disabled={!!deletingPostId || !!deletingProductId}
              >
                {(!!deletingPostId || !!deletingProductId) ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
