"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import StarIcon from '@mui/icons-material/Star';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ReviewCardData {
  id: string;
  rating: number;
  comment: string | null;
  seller_response?: string | null;
  seller_rating?: number | null;
  created_at: string;
  reviewer?: { id: string; full_name?: string; username?: string; avatar_url?: string };
  product?: { id: string; title: string };
}

interface ReviewsSliderProps { creatorId: string; limit?: number; }

type ReviewRow = {
  id: string;
  rating?: number | null;
  comment?: string | null;
  seller_rating?: number | null;
  seller_comment?: string | null;
  created_at: string;
  reviewer?:
    | {
        id?: string | null;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
      }
    | Array<{
        id?: string | null;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
      }>
    | null;
  product?:
    | { id: string; title?: string | null } 
    | Array<{ id: string; title?: string | null }>
    | null;
};

export const ReviewsSlider: React.FC<ReviewsSliderProps> = ({ creatorId, limit = 12 }) => {
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [reviewsEnabled, setReviewsEnabled] = useState(true)

  useEffect(() => {
    const checkSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'enable_reviews')
        .single()
      
      if (data?.value === 'false') {
        setReviewsEnabled(false)
      }
    }
    checkSettings()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const unwrap = <T,>(value: T | T[] | null | undefined): T | undefined => {
          if (!value) return undefined;
          return Array.isArray(value) ? value[0] : value;
        };
        const { data, error } = await supabase
          .from('reviews')
          .select('id,rating,comment,seller_rating,seller_comment,created_at, reviewer:reviewer_id(id,full_name,username,avatar_url), product:product_id(id,title)')
          .eq('seller_id', creatorId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        const mapped = (data || [])
          .map((r: ReviewRow) => {
            const reviewer = unwrap(r.reviewer);
            const productInfo = unwrap(r.product);
            const buyerRating = typeof r.rating === 'number' && r.rating > 0 ? r.rating : null;
            const sellerRating = typeof r.seller_rating === 'number' && r.seller_rating > 0 ? r.seller_rating : null;
            const buyerComment = (r.comment || '').trim();
            const sellerComment = (r.seller_comment || '').trim();

            if (!buyerRating && !sellerRating && !buyerComment && !sellerComment) return null;

            return {
              id: r.id,
              rating: buyerRating ?? sellerRating ?? 0,
              comment: buyerComment || null,
              seller_response: sellerComment || null,
              seller_rating: sellerRating,
              created_at: r.created_at,
              reviewer: reviewer
                ? {
                    id: reviewer.id || 'unknown',
                    full_name: reviewer.full_name || reviewer.username || 'Anonymous',
                    username: reviewer.username || 'anonymous',
                    avatar_url: reviewer.avatar_url || ''
                  }
                : undefined,
              product: productInfo ? { id: productInfo.id, title: productInfo.title || 'Product' } : undefined
            };
          });
        let normalized: ReviewCardData[] = mapped.filter(Boolean) as ReviewCardData[];
        if (normalized.length === 0) {
          normalized = Array.from({length:5}).map((_,i) => ({
            id: `dummy-review-${i}`,
            rating: 5 - (i % 2),
            comment: `This is a sample seller review ${i+1}. Replace once you collect real feedback.`,
            seller_rating: 5,
            seller_response: 'Professional and responsive seller.',
            created_at: new Date(Date.now()- i*3600_000).toISOString(),
            reviewer: { id: `dummy-user-${i}`, full_name: `Sample User ${i+1}`, username: `user${i+1}`, avatar_url: '' },
            product: { id: 'sample-product', title: 'Sample Product' }
          }));
        }
        setReviews(normalized);
      } catch (e: unknown) {
        console.error('Failed to load reviews', e);
        setError('Could not load reviews');
      } finally { setLoading(false); }
    })();
  }, [creatorId, limit]);

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return;
    const amount = 320; // px per card
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  if (!reviewsEnabled) return null;

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">Loading reviews…</div>;
  if (error) return <div className="h-40 flex items-center justify-center text-sm text-red-500 dark:text-red-400">{error}</div>;
  if (reviews.length === 0) return <div className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</div>;

  return (
    <div className="relative">
      {/* Header with count and navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{reviews.length} review{reviews.length!==1 && 's'}</span>
          <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-amber-500" style={{fontSize:'16px'}} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">5.0</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>scroll('left')} className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-all" aria-label="Prev">
            <ChevronLeftIcon fontSize="small" className="text-gray-600 dark:text-gray-300"/>
          </button>
          <button onClick={()=>scroll('right')} className="p-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-all" aria-label="Next">
            <ChevronRightIcon fontSize="small" className="text-gray-600 dark:text-gray-300"/>
          </button>
        </div>
      </div>

      {/* Reviews carousel */}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2" style={{scrollSnapType:'x mandatory', scrollBehavior:'smooth'}}>
        {reviews.map(r => (
          <div key={r.id} className="min-w-[320px] max-w-[320px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow scroll-snap-align-start flex flex-col">
            {/* Top row - Avatar, Name, Stars */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                  {r.reviewer?.avatar_url ? (
                    <Image
                      src={r.reviewer.avatar_url}
                      alt={(r.reviewer.full_name || r.reviewer.username || 'Reviewer') + ' avatar'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{(r.reviewer?.full_name||r.reviewer?.username||'?').slice(0,1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {r.reviewer?.full_name || r.reviewer?.username || 'Anonymous'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                {Array.from({length:5}).map((_,i)=>(
                  <StarIcon key={i} style={{fontSize:'12px'}} className={i < r.rating ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}/>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="flex-1 mb-3">
              {r.comment ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 leading-relaxed">{r.comment}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No comment provided.</p>
              )}
            </div>

            {/* Seller response section */}
            {(typeof r.seller_rating === 'number' || r.seller_response) && (
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                  <span className="text-[11px] font-medium text-green-700 dark:text-green-400">Seller Response</span>
                </div>
                {typeof r.seller_rating === 'number' && (
                  <p className="text-xs text-gray-600 dark:text-gray-300">Rating: <span className="font-semibold">{r.seller_rating}/5</span></p>
                )}
                {r.seller_response && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{r.seller_response}</p>
                )}
              </div>
            )}

            {/* Product badge */}
            {r.product && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-full line-clamp-1">
                  {r.product.title}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
