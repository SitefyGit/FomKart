'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

// Convert tag to URL-friendly slug
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Popular suggestions for autocomplete
const popularSuggestions = [
  'Affiliate Marketing',
  'Logo Design',
  'Website Development',
  'SEO Services',
  'Video Editing',
  'Social Media Marketing',
  'WordPress',
  'Copywriting',
  'Virtual Assistant',
  'Amazon FBA',
  'Shopify',
  'Landing Page',
  'Web Design',
  'Content Writing',
  'Graphic Design',
  'Mobile App',
  'E-commerce',
  'Brand Identity',
]

export default function MarketSearch() {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim()) {
      const filtered = popularSuggestions.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered.slice(0, 6))
    } else {
      setFilteredSuggestions(popularSuggestions.slice(0, 6))
    }
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      const slug = tagToSlug(finalQuery.trim())
      router.push(`/market/${slug}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
      setShowSuggestions(false)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={wrapperRef} className="max-w-2xl mx-auto relative">
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="What service are you looking for?"
          className="w-full pl-14 pr-32 py-5 rounded-2xl text-gray-900 text-lg shadow-2xl focus:ring-4 focus:ring-white/30 outline-none transition-all placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-28 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={() => handleSearch()}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          Search
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-3 py-2 font-medium">
              {query ? 'Suggestions' : 'Popular Searches'}
            </p>
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion)
                  handleSearch(suggestion)
                  setShowSuggestions(false)
                }}
                className="w-full text-left px-3 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
