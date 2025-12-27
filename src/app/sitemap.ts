import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fomkart.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/market`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/digital-products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/creator-signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic product pages
  const productPages: MetadataRoute.Sitemap = []
  
  // Dynamic creator pages
  const creatorPages: MetadataRoute.Sitemap = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Get all active products
      const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('orders_count', { ascending: false })
        .limit(1000)

      if (products) {
        products.forEach((product) => {
          productPages.push({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          })
        })
      }

      // Get all creators
      const { data: creators } = await supabase
        .from('users')
        .select('username, updated_at')
        .eq('is_creator', true)
        .order('total_sales', { ascending: false })
        .limit(500)

      if (creators) {
        creators.forEach((creator) => {
          if (creator.username) {
            creatorPages.push({
              url: `${baseUrl}/creator/${creator.username}`,
              lastModified: creator.updated_at ? new Date(creator.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.6,
            })
          }
        })
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return [...staticPages, ...productPages, ...creatorPages]
}
