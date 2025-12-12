import Link from 'next/link'
import { BadgeCheck, Star, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Cache this section for 60s to avoid re-fetching on every request
export const revalidate = 60

type Creator = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean | null
  total_sales: number | null
  rating: number | null
  total_reviews: number | null
}

export default async function TopCreatorsSection() {
  const { data } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, bio, is_verified, total_sales, rating, total_reviews')
    .eq('is_creator', true)
    .order('rating', { ascending: false })
    .order('total_sales', { ascending: false })
    .limit(8)

  const topCreators = (data as Creator[]) || []
  const creatorIds = topCreators.map((creator) => creator.id)

  const statsMap = new Map<string, { rating: number; count: number }>()

  if (creatorIds.length) {
    type SellerRatingRow = { seller_id: string | null; seller_rating: number | null }
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('seller_id, seller_rating')
      .eq('is_public', true)
      .in('seller_id', creatorIds)
      .not('seller_rating', 'is', null)

    const totals = new Map<string, { sum: number; count: number }>()

    for (const row of (ratingRows as SellerRatingRow[] | null) ?? []) {
      if (!row || !row.seller_id) continue
      const ratingValue = Number(row.seller_rating)
      if (!Number.isFinite(ratingValue) || ratingValue <= 0) continue
      const current = totals.get(row.seller_id) ?? { sum: 0, count: 0 }
      current.sum += ratingValue
      current.count += 1
      totals.set(row.seller_id, current)
    }

    for (const [sellerId, aggregate] of totals.entries()) {
      if (aggregate.count === 0) continue
      const average = Math.round((aggregate.sum / aggregate.count) * 10) / 10
      statsMap.set(sellerId, { rating: average, count: aggregate.count })
    }
  }

  const enrichedCreators = topCreators.map((creator) => {
    const stats = statsMap.get(creator.id)
    const derivedRating = stats?.rating ?? creator.rating ?? 0
    const derivedCount = stats?.count ?? creator.total_reviews ?? 0
    return {
      ...creator,
      rating: derivedRating,
      total_reviews: derivedCount
    }
  })

  return (
    <section className="py-12 sm:py-16 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet our top creators</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">Talented professionals ready to help your business succeed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {enrichedCreators.map((creator, index) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.username}`}
              prefetch
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 lg:p-8 transform hover:scale-[1.02] hover:-translate-y-1 border border-transparent dark:border-gray-700"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 overflow-hidden flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 transition-all duration-300 relative flex-shrink-0">
                  {creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.avatar_url} alt={creator.full_name || creator.username} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-white font-bold">{(creator.full_name || creator.username).slice(0,1)}</span>
                  )}
                  {creator.is_verified ? <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-emerald-600" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors truncate">
                    {creator.full_name || creator.username}
                  </h3>
                  {creator.bio ? (
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors line-clamp-2">{creator.bio}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 sm:px-3 py-1 rounded-full">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-200 text-sm">{Number(creator.rating ?? 0).toFixed(1)}</span>
                      <span className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm">({creator.total_reviews ?? 0})</span>
                    </div>
                    <span className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-200 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 sm:px-3 py-1 rounded-full">{(creator.total_sales ?? 0).toLocaleString()} sales</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all duration-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
          {topCreators.length === 0 && (
            <div className="text-center text-gray-500">No creators yet.</div>
          )}
        </div>
      </div>
    </section>
  )
}
