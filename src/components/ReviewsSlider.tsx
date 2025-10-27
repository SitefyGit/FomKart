"use client";
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StarIcon from '@mui/icons-material/Star';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ReviewCardData {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: { id: string; full_name?: string; username?: string; avatar_url?: string };
  product?: { id: string; title: string };
}

interface ReviewsSliderProps { creatorId: string; limit?: number; }

export const ReviewsSlider: React.FC<ReviewsSliderProps> = ({ creatorId, limit = 12 }) => {
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reviews')
          .select('id,rating,comment,created_at, reviewer:reviewer_id(id,full_name,username,avatar_url), product:product_id(id,title)')
          .eq('seller_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        let normalized: ReviewCardData[] = (data || []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer: r.reviewer ? {
            id: r.reviewer.id,
            full_name: r.reviewer.full_name,
            username: r.reviewer.username,
            avatar_url: r.reviewer.avatar_url
          } : undefined,
          product: r.product ? { id: r.product.id, title: r.product.title } : undefined
        }));
        if (normalized.length === 0) {
          normalized = Array.from({length:5}).map((_,i) => ({
            id: `dummy-review-${i}`,
            rating: 5 - (i % 2),
            comment: `This is a sample review ${i+1}. Replace by collecting real feedback from customers.`,
            created_at: new Date(Date.now()- i*3600_000).toISOString(),
            reviewer: { id: `dummy-user-${i}`, full_name: `Sample User ${i+1}`, username: `user${i+1}`, avatar_url: '' },
            product: { id: 'sample-product', title: 'Sample Product' }
          }));
        }
        setReviews(normalized);
      } catch (e: any) {
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

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-500">Loading reviews…</div>;
  if (error) return <div className="h-40 flex items-center justify-center text-sm text-red-500">{error}</div>;
  if (reviews.length === 0) return <div className="text-sm text-gray-500">No reviews yet.</div>;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{reviews.length} review{reviews.length!==1 && 's'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>scroll('left')} className="p-2 rounded-full border hover:bg-gray-50" aria-label="Prev"><ChevronLeftIcon fontSize="small"/></button>
          <button onClick={()=>scroll('right')} className="p-2 rounded-full border hover:bg-gray-50" aria-label="Next"><ChevronRightIcon fontSize="small"/></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-thin pb-2" style={{scrollSnapType:'x mandatory'}}>
        {reviews.map(r => (
          <div key={r.id} className="min-w-[300px] max-w-[300px] bg-white border rounded-xl p-4 shadow-sm scroll-snap-align-start">
            <div className="flex items-center justify-between mb-2">
              <div className="flex -space-x-2 items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {r.reviewer?.avatar_url ? <img src={r.reviewer.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-medium text-gray-500">{(r.reviewer?.full_name||r.reviewer?.username||'?').slice(0,2).toUpperCase()}</span>}
                </div>
                <span className="text-xs text-gray-600 ml-2 line-clamp-1">
                  {r.reviewer?.full_name || r.reviewer?.username || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({length:5}).map((_,i)=>(<StarIcon key={i} fontSize="inherit" className={i < r.rating ? 'text-amber-500' : 'text-gray-300'} style={{fontSize:'14px'}}/>))}
              </div>
            </div>
            <p className="text-xs text-gray-600 line-clamp-4 mb-3">{r.comment || 'No comment provided.'}</p>
            {r.product && <div className="text-[11px] font-medium text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">{r.product.title}</div>}
            <div className="mt-3 text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
