import { Metadata } from 'next'
import { ReactNode } from 'react'

// Convert slug to display name
function tagSlugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type Props = {
  params: Promise<{ tag: string }>
  children: ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const tagSlug = resolvedParams.tag
  const tagName = tagSlugToName(tagSlug)
  
  const title = `${tagName} Services | Find ${tagName} Freelancers | FomKart`
  const description = `Hire top ${tagName.toLowerCase()} freelancers on FomKart. Browse verified ${tagName.toLowerCase()} services with ratings, reviews & secure payments. Starting from $5.`
  
  return {
    title,
    description,
    keywords: [
      tagName.toLowerCase(),
      `${tagName.toLowerCase()} services`,
      `${tagName.toLowerCase()} freelancer`,
      `hire ${tagName.toLowerCase()}`,
      `${tagName.toLowerCase()} expert`,
      'freelance services',
      'FomKart',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'FomKart',
      url: `https://fomkart.com/market/${tagSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://fomkart.com/market/${tagSlug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// Layout component that wraps the page
export default function TagLayout({ children }: Props) {
  return <>{children}</>
}
