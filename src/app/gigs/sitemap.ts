import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Convert tag to URL-friendly slug
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Pre-defined popular tags for SEO (these pages always exist)
const staticTags = [
  // Marketing
  'affiliate-marketing',
  'seo',
  'social-media-marketing',
  'email-marketing',
  'content-marketing',
  'ppc-advertising',
  'influencer-marketing',
  'digital-marketing',
  'affiliate-sales',
  'clickbank',
  'affiliate-program',
  'link-promotion',
  'amazon-affiliate',
  'travel-affiliate',
  
  // Development
  'web-development',
  'wordpress',
  'react',
  'nodejs',
  'python',
  'mobile-app',
  'e-commerce',
  'api-development',
  'shopify',
  'wix',
  'webflow',
  'landing-page',
  
  // Design
  'logo-design',
  'ui-ux-design',
  'graphic-design',
  'brand-identity',
  'web-design',
  'illustration',
  'packaging-design',
  'social-media-design',
  'photoshop',
  'figma',
  
  // Writing
  'content-writing',
  'copywriting',
  'blog-writing',
  'technical-writing',
  'translation',
  'proofreading',
  'resume-writing',
  'ghostwriting',
  'article-writing',
  'product-description',
  
  // Video & Animation
  'video-editing',
  'animation',
  'motion-graphics',
  'explainer-video',
  'youtube-editing',
  'whiteboard-animation',
  '3d-animation',
  'intro-outro',
  
  // Business
  'business-plan',
  'market-research',
  'financial-analysis',
  'virtual-assistant',
  'data-entry',
  'project-management',
  'consulting',
  'presentations',
  
  // E-commerce specific
  'amazon-fba',
  'dropshipping',
  'etsy',
  'ebay',
  'product-listing',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fomkart.com'
  
  // Start with static tag pages
  const tagEntries: MetadataRoute.Sitemap = staticTags.map((tag) => ({
    url: `${baseUrl}/gigs/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Add dynamic tags from database
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: products } = await supabase
        .from('products')
        .select('tags')
        .eq('status', 'active')
        .not('tags', 'is', null)

      if (products) {
        const tagSet = new Set<string>()
        products.forEach((product) => {
          if (product.tags && Array.isArray(product.tags)) {
            product.tags.forEach((tag: string) => {
              const slug = tagToSlug(tag.trim())
              if (slug && !staticTags.includes(slug)) {
                tagSet.add(slug)
              }
            })
          }
        })

        // Add dynamic tags to sitemap
        tagSet.forEach((slug) => {
          tagEntries.push({
            url: `${baseUrl}/gigs/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          })
        })
      }
    }
  } catch (error) {
    console.error('Error generating tag sitemap:', error)
  }

  // Add main gigs index page
  tagEntries.unshift({
    url: `${baseUrl}/gigs`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })

  return tagEntries
}
