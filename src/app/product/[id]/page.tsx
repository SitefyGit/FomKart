'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart as addToCartApi, getCurrentUser, supabase } from '@/lib/supabase';
import { ProductMediaGallery } from '@/components/ProductMediaGallery';
import {
  Star,
  Clock,
  Check,
  ShoppingCart,
  Share2,
  User,
  MessageCircle,
  ArrowRight,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

interface ProductPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  delivery_time: string;
  revisions: number;
  features: string[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  starting_price: number;
  type: 'service' | 'product';
  creator_id: string;
  category_id: string;
  tags: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  creator?: User;
  packages?: ProductPackage[];
  youtubeVideoId?: string;
  demoUrl?: string;
  totalSales?: number;
  avgRating?: number;
  reviewCount?: number;
  features?: string[];
  requirements?: string[];
}

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  verified: boolean;
  created_at: string;
}

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: User;
}

type ReviewRow = {
  id: string;
  rating?: number | null;
  comment?: string | null;
  created_at: string;
  reviewer?:
    | {
        id?: string | null;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
        is_verified?: boolean | null;
      }
    | Array<{
        id?: string | null;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
        is_verified?: boolean | null;
      }>
    | null;
};

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    email: '',
    requirements: ''
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
  const user = await getCurrentUser();
  setCurrentUserId(user?.id || null);
        // Attempt to load real product
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select(`*, creator:creator_id(id, full_name, username, avatar_url, bio, is_verified)`)
          .eq('id', resolvedParams.id)
          .single();

        if (prod && !prodErr) {
          // Fetch packages
            let { data: pkgs } = await supabase
              .from('product_packages')
              .select('*')
              .eq('product_id', prod.id)
              .order('sort_order', { ascending: true });

          // If no packages exist, auto-create a sensible default so buy flow works
          if (!pkgs || pkgs.length === 0) {
            try {
              const defaultPrice = Number(prod.base_price) || 0;
              const defaultFeatures = Array.isArray(prod.features) ? prod.features : [];
              const { data: createdPkg, error: createErr } = await supabase
                .from('product_packages')
                .insert({
                  product_id: prod.id,
                  name: 'Standard',
                  description: prod.description?.slice(0, 160) || 'Standard package',
                  price: defaultPrice,
                  // Schema uses delivery_time (days)
                  delivery_time: 3,
                  revisions: 1,
                  features: defaultFeatures,
                  sort_order: 1
                })
                .select('*')
                .single();
              if (!createErr && createdPkg) {
                pkgs = [createdPkg];
              }
            } catch (e) {
              console.warn('Failed to auto-create default package', e);
            }
          }

          // Extract video id if any stored in videos array
          let youTubeId: string | undefined;
          if (Array.isArray(prod.videos) && prod.videos.length) {
            const raw = prod.videos[0];
            const m = raw?.match?.(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) || raw?.match?.(/^([A-Za-z0-9_-]{6,})$/);
            youTubeId = m ? m[1] : undefined;
          }
          // External / demo link encoded in requirements lines starting with "External:" or "Download:" or we keep first external
          let externalLink: string | undefined;
          if (Array.isArray(prod.requirements)) {
            const extLine = prod.requirements.find((r: string) => r.startsWith('External:'));
            if (extLine) externalLink = extLine.replace('External:','').trim();
          }
          let fetchedReviews: Review[] = [];
          try {
            const unwrap = <T,>(value: T | T[] | null | undefined): T | undefined => {
              if (!value) return undefined;
              return Array.isArray(value) ? value[0] : value;
            };
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select(`id, rating, comment, created_at, reviewer:reviewer_id(id, full_name, username, avatar_url, is_verified)`)
              .eq('product_id', prod.id)
              .eq('is_public', true)
              .order('created_at', { ascending: false });
            fetchedReviews = (reviewsData || []).map((row: ReviewRow) => {
              const reviewer = unwrap(row.reviewer);
              const commentText = (row.comment || '').trim();
              return {
                id: row.id,
                user_id: reviewer?.id || 'unknown',
                product_id: prod.id,
                rating: typeof row.rating === 'number' ? row.rating : 0,
                comment: commentText || 'Buyer left a rating.',
                created_at: row.created_at,
                reviewer: {
                  id: reviewer?.id || 'unknown',
                  full_name: reviewer?.full_name || reviewer?.username || 'Anonymous',
                  username: reviewer?.username || 'anonymous',
                  email: '',
                  avatar_url: reviewer?.avatar_url || '',
                  bio: '',
                  verified: !!reviewer?.is_verified,
                  created_at: new Date().toISOString()
                }
              };
            });
          } catch (reviewErr) {
            console.warn('Failed to load reviews for product', reviewErr);
          }
          const fallbackReviewCount =
            typeof prod.reviews_count === 'number'
              ? prod.reviews_count
              : typeof prod.total_reviews === 'number'
                ? prod.total_reviews
                : 0;
          const reviewCount = fetchedReviews.length || fallbackReviewCount;
          const reviewAverage = fetchedReviews.length
            ? Number((fetchedReviews.reduce((sum, item) => sum + item.rating, 0) / fetchedReviews.length).toFixed(2))
            : (typeof prod.rating === 'number' ? Number(prod.rating) : 0);

          const mapped: Product = {
            id: prod.id,
            title: prod.title,
            description: prod.description || '',
            images: Array.isArray(prod.images) && prod.images.length ? prod.images : [ 'https://picsum.photos/600/400?random=1' ],
            starting_price: prod.base_price || 0,
            type: prod.type === 'service' ? 'service' : 'product',
            creator_id: prod.creator_id,
            category_id: prod.category_id,
            tags: prod.tags || [],
            featured: !!prod.is_featured,
            created_at: prod.created_at,
            updated_at: prod.updated_at,
            totalSales: prod.orders_count || 0,
            avgRating: reviewAverage,
            reviewCount,
            youtubeVideoId: youTubeId,
            demoUrl: externalLink,
            features: prod.features || [],
            requirements: prod.requirements || [],
            creator: prod.creator ? {
              id: prod.creator.id,
              full_name: prod.creator.full_name || prod.creator.username,
              username: prod.creator.username,
              email: '',
              avatar_url: prod.creator.avatar_url,
              bio: prod.creator.bio || '',
              verified: !!prod.creator.is_verified,
              created_at: new Date().toISOString()
            } : undefined,
            packages: (pkgs||[]).map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: Number(p.price),
              // Map numeric delivery_days -> display string; support legacy field if present
              delivery_time: (p.delivery_time ? `${p.delivery_time} days` : (p.delivery_days ? `${p.delivery_days} days` : '—')),
              revisions: p.revisions || 0,
              features: p.features || []
            }))
          };
          setProduct(mapped);
          setSelectedPackage(mapped.packages?.[0] || null);
          setReviews(fetchedReviews);
        } else {
          // Fallback mock
          const mock: Product = {
            id: resolvedParams.id,
            title: 'Professional Logo Design & Brand Identity',
            description: 'I will create a stunning, professional logo design that perfectly represents your brand.',
            images: [ 'https://picsum.photos/1200/600?random=1', 'https://picsum.photos/1200/600?random=2' ],
            starting_price: 25,
            type: 'service',
            creator_id: 'creator1',
            category_id: 'design',
            tags: ['logo design','branding'],
            featured: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            totalSales: 0,
            avgRating: 0,
            reviewCount: 0,
            features: ['1 concept','PNG'],
            requirements: [],
            creator: { id:'creator1', full_name:'Demo Creator', username:'demo_creator', email:'', avatar_url:'https://picsum.photos/100/100?random=10', bio:'Demo bio', verified:true, created_at:new Date().toISOString() },
            packages: [
              { id:'basic', name:'Basic', description:'Basic deliverable', price:25, delivery_time:'2 days', revisions:2, features:['1 concept','PNG'] }
            ]
          };
          setProduct(mock);
          setSelectedPackage(mock.packages?.[0] || null);
          setReviews([]);
        }
      } catch (e) {
        console.error('Product load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [resolvedParams.id]);

  const handleAddToCart = async () => {
    if (!product || !selectedPackage) return;
    try {
      setAddingToCart(true);
      const user = await getCurrentUser();
      if (!user) {
        setCartFeedback('Please log in to add items to cart');
        setTimeout(() => setCartFeedback(null), 2000);
        router.push('/auth/login');
        return;
      }

      const ok = await addToCartApi({
        product_id: product.id,
        package_id: selectedPackage.id,
        quantity: 1
      });
      if (ok) {
        setCartFeedback('Added to cart');
        setTimeout(() => setCartFeedback(null), 2000);
      } else {
        setCartFeedback('Failed to add to cart');
        setTimeout(() => setCartFeedback(null), 2000);
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
      setCartFeedback('Failed to add to cart');
      setTimeout(() => setCartFeedback(null), 2000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContinue = () => {
    if (!selectedPackage) return;
    setShowPurchaseModal(true);
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !selectedPackage) return;
    
    // Create checkout item
    const checkoutItem = {
      productId: product.id,
      packageId: selectedPackage.id,
      quantity: 1,
      requirements: {
        name: purchaseForm.name,
        email: purchaseForm.email,
        notes: purchaseForm.requirements
      }
    };
    
    // Navigate to checkout with the item
    const itemsParam = encodeURIComponent(JSON.stringify([checkoutItem]));
    setShowPurchaseModal(false);
    router.push(`/checkout?items=${itemsParam}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
            </button>
            <Link href="/" className="hover:text-emerald-600">FomKart</Link>
            <span className="mx-2">/</span>
            <Link href="/category/digital-products" className="hover:text-emerald-600">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{product.title}</span>
          </nav>
        </div>
      </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Media and Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <ProductMediaGallery
                images={product.images}
                youtubeVideoId={product.youtubeVideoId}
                title={product.title}
              />
              
              {/* Live Demo Button */}
              {product.demoUrl && (
                <div className="mt-4 flex justify-end">
                  <a
                    href={product.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Live Demo
                  </a>
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Title & quick actions */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">{product.title}</h1>
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {currentUserId && product.creator_id === currentUserId && (
                    <button
                      onClick={() => router.push(`/product/${product.id}/edit`)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Service</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Key Features</h3>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                    {product.features.map((f,i)=>(
                      <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5" /> <span>{f}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {product.requirements && product.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Included / Links</h3>
                  <ul className="space-y-1 text-sm text-gray-700 break-all">
                    {product.requirements.map((r,i)=>{
                      const isLink = /https?:\/\//i.test(r);
                      return <li key={i}>{isLink ? <a href={r.replace(/^External:\s*/,'').replace(/^Download:\s*/,'').trim()} target="_blank" className="text-blue-600 hover:underline">{r.replace(/^External:\s*/,'').replace(/^Download:\s*/,'').trim()}</a> : r}</li>
                    })}
                  </ul>
                </div>
              )}
              
              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{product.totalSales}</div>
                  <div className="text-sm text-gray-500">Sales</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-900 ml-1">{product.avgRating}</span>
                  </div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedPackage ? `${selectedPackage.delivery_time}` : '—'}
                  </div>
                  <div className="text-sm text-gray-500">Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedPackage?.revisions || 'Unlimited'}
                  </div>
                  <div className="text-sm text-gray-500">Revisions</div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews ({product.reviewCount ?? reviews.length})</h2>
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                ) : reviews.map((review) => (
                  <div key={review.id} className="flex space-x-4">
                    <Image
                      src={review.reviewer.avatar_url || 'https://picsum.photos/50/50?random=99'}
                      alt={review.reviewer.full_name}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{review.reviewer.full_name}</span>
                        {review.reviewer.verified && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Creator Info and Packages */}
          <div className="space-y-6">
            {/* Creator Info */}
            {product.creator && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Link
                  href={`/creator/${product.creator.username}`}
                  className="flex items-center space-x-4 mb-4 group"
                >
                  <Image
                    src={product.creator.avatar_url || 'https://picsum.photos/60/60?random=98'}
                    alt={product.creator.full_name}
                    width={60}
                    height={60}
                    className="rounded-full transition-transform duration-200 group-hover:scale-105"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{product.creator.full_name}</span>
                      {product.creator.verified && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">@{product.creator.username}</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.avgRating}</span>
                      <span className="text-sm text-gray-500">({product.reviewCount ?? 0} reviews)</span>
                    </div>
                  </div>
                </Link>
                <p className="text-gray-700 text-sm mb-4">{product.creator.bio}</p>
                <button
                  onClick={() => {
                    if (product?.creator?.username) {
                      router.push(`/creator/${product.creator.username}?contact=1`);
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Creator
                </button>
              </div>
            )}

            {/* Package Selection */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {product.packages?.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        selectedPackage?.id === pkg.id
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPackage && (
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{selectedPackage.name}</h3>
                      <div className="text-2xl font-bold text-blue-600">${selectedPackage.price}</div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{selectedPackage.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-semibold">{selectedPackage.delivery_time} delivery</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      <span className="font-semibold">{selectedPackage.revisions} revisions</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">What you get:</h4>
                    <div className="space-y-2">
                      {selectedPackage.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleContinue}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Continue (${selectedPackage.price})
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-60"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {addingToCart ? 'Adding…' : 'Add to Cart'}
                    </button>
                    {cartFeedback && (
                      <div className="text-center text-sm text-green-600">{cartFeedback}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1.5px]"
            onClick={() => setShowPurchaseModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Purchase Details</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="font-medium text-gray-900">{product.title}</div>
              <div className="text-sm text-gray-600">Package: {selectedPackage.name}</div>
              <div className="text-sm text-gray-900 font-semibold">${selectedPackage.price}</div>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your name</label>
                <input
                  type="text"
                  required
                  value={purchaseForm.name}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={purchaseForm.email}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, email: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requirements / Notes</label>
                <textarea
                  rows={4}
                  value={purchaseForm.requirements}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, requirements: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share any details that will help fulfill this order."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={product.title}
        />
      )}
    </div>
  );
}