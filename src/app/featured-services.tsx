import Link from 'next/link'
import { Star, ArrowRight } from 'lucide-react'
import { CubeIcon } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'

// Cache this list for 60s; content stays fresh enough and speeds navigation
export const revalidate = 60

type Service = {
  id: string
  title: string
  images: string[] | null
  base_price: number
  rating: number | null
  reviews_count: number | null
  tags?: string[] | null
  type?: 'product' | 'service' | 'course' | 'consultation'
  category_data?: { name: string } | null
  creator: { id: string; full_name: string | null; username: string; avatar_url: string | null } | null
}

const getTypeLabel = (type?: string) => {
  switch (type) {
    case 'service': return 'Service'
    case 'course': return 'Course'
    case 'consultation': return 'Consultation'
    case 'product': return 'Digital Product'
    default: return 'Digital Product'
  }
}

export default async function FeaturedServicesSection() {
  const { data } = await supabase
    .from('products')
    .select('id, title, images, base_price, rating, reviews_count, tags, type, category_data:category_id(name), creator:creator_id(id, username, full_name, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(9)

  const services = (data as unknown as Service[]) || []
  const productIds = services.map((service) => service.id)

  type ProductRatingRow = { product_id: string | null; rating: number | null }
  const statsMap = new Map<string, { rating: number; count: number }>()

  if (productIds.length) {
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .eq('is_public', true)
      .in('product_id', productIds)
      .not('rating', 'is', null)

    const totals = new Map<string, { sum: number; count: number }>()

    for (const row of (ratingRows as ProductRatingRow[] | null) ?? []) {
      if (!row || !row.product_id) continue
      const ratingValue = Number(row.rating)
      if (!Number.isFinite(ratingValue) || ratingValue <= 0) continue
      const current = totals.get(row.product_id) ?? { sum: 0, count: 0 }
      current.sum += ratingValue
      current.count += 1
      totals.set(row.product_id, current)
    }

    for (const [productId, aggregate] of totals.entries()) {
      if (aggregate.count === 0) continue
      const average = Math.round((aggregate.sum / aggregate.count) * 10) / 10
      statsMap.set(productId, { rating: average, count: aggregate.count })
    }
  }

  const servicesWithRatings = services.map((service) => {
    const stats = statsMap.get(service.id)
    const derivedRating = stats?.rating ?? service.rating ?? 0
    const derivedCount = stats?.count ?? service.reviews_count ?? 0
    return {
      ...service,
      rating: derivedRating,
      reviews_count: derivedCount
    }
  })

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Popular offerings</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">Trending offerings from our community</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {servicesWithRatings.map((service: Service, index: number) => (
            <Link
              key={service.id}
              href={`/product/${service.id}`}
              prefetch
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.03] hover:-translate-y-2 border border-transparent dark:border-gray-700"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-video bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                {service.images && service.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <CubeIcon className="w-10 h-10 text-emerald-600" />
                )}
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors text-sm sm:text-base">{service.title}</h3>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 overflow-hidden flex items-center justify-center text-xs sm:text-sm text-white">
                    {service.creator?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.creator.avatar_url} alt={service.creator.full_name || service.creator.username} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="font-bold">{(service.creator?.full_name || service.creator?.username || 'U').slice(0,1)}</span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors truncate">{service.creator?.full_name || service.creator?.username}</span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 sm:px-3 py-1 rounded-full">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-200">{Number(service.rating ?? 0).toFixed(1)}</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">({service.reviews_count ?? 0})</span>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                      {service.category_data?.name || getTypeLabel(service.type)}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-lg group-hover:text-emerald-600 transition-colors">From ${service.base_price}</span>
                </div>
              </div>
            </Link>
          ))}
          {servicesWithRatings.length === 0 && (
            <div className="text-center text-gray-500">No services yet.</div>
          )}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/category/digital-products"
            prefetch
            className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            <span>View all offerings</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
