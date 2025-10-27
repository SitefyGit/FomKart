import React from 'react'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  className?: string
}

export function YouTubeEmbed({ videoId, title = "Featured Video", className = "" }: YouTubeEmbedProps) {
  if (!videoId) return null

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title}
          loading="lazy"
        />
      </div>
      <div className="mt-4 text-center">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Watch on YouTube
        </a>
      </div>
    </div>
  )
}
