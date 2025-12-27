// JSON-LD Structured Data for SEO
// https://developers.google.com/search/docs/advanced/structured-data

export interface BreadcrumbItem {
  name: string
  url: string
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Generate Service schema for tag pages
export function generateServiceCategorySchema({
  name,
  description,
  url,
  serviceCount,
}: {
  name: string
  description: string
  url: string
  serviceCount: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} Services`,
    description,
    url,
    numberOfItems: serviceCount,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [],
      numberOfItems: serviceCount,
    },
    provider: {
      '@type': 'Organization',
      name: 'FomKart',
      url: 'https://fomkart.com',
    },
  }
}

// Generate Product schema
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = 'USD',
  url,
  seller,
  rating,
  reviewCount,
}: {
  name: string
  description: string
  image: string
  price: number
  currency?: string
  url: string
  seller: { name: string; url: string }
  rating?: number
  reviewCount?: number
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: seller.name,
        url: seller.url,
      },
    },
  }

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

// Generate WebSite schema with SearchAction for sitelinks searchbox
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FomKart',
    url: 'https://fomkart.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://fomkart.com/gigs/{search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// Generate Organization schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FomKart',
    url: 'https://fomkart.com',
    logo: 'https://fomkart.com/logo.png',
    sameAs: [
      'https://twitter.com/fomkart',
      'https://facebook.com/fomkart',
      'https://linkedin.com/company/fomkart',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  }
}

// Component to render JSON-LD script tag
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default JsonLd
