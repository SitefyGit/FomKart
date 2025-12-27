'use client'

import Link from 'next/link'
import { Tag } from 'lucide-react'

interface RelatedTagsProps {
  tags: string[]
  currentTag?: string
  title?: string
  className?: string
}

// Convert tag to URL-friendly slug
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function RelatedTags({ 
  tags, 
  currentTag, 
  title = 'Related tags',
  className = '' 
}: RelatedTagsProps) {
  // Filter out current tag and limit to 12
  const displayTags = tags
    .filter(tag => !currentTag || tag.toLowerCase() !== currentTag.toLowerCase())
    .slice(0, 12)

  if (displayTags.length === 0) return null

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-gray-500" />
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <Link
            key={tag}
            href={`/market/${tagToSlug(tag)}`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm font-medium transition-all border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600"
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Standalone component for showing product tags that link to gig pages
interface ProductTagsProps {
  tags: string[]
  maxTags?: number
  size?: 'sm' | 'md'
}

export function ProductTags({ tags, maxTags = 5, size = 'sm' }: ProductTagsProps) {
  if (!tags || tags.length === 0) return null

  const displayTags = tags.slice(0, maxTags)
  const remainingCount = tags.length - maxTags

  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm'

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => (
        <Link
          key={tag}
          href={`/gigs/${tagToSlug(tag)}`}
          className={`${sizeClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full transition-colors`}
          title={`Browse all ${tag} services`}
        >
          {tag}
        </Link>
      ))}
      {remainingCount > 0 && (
        <span className={`${sizeClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full`}>
          +{remainingCount} more
        </span>
      )}
    </div>
  )
}

export default RelatedTags
